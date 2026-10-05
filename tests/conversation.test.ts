import { beforeAll, afterEach, describe, expect, it, vi } from "vitest";
import { readFile } from "node:fs/promises";
import { canonicalModel, mentionedModels } from "../src/domain/identification";
import { clarifyBrief, comparisonFacts } from "../src/domain/conversation";
import { catalog } from "../src/domain/catalog";
import { createWorkspace, type Actor } from "../src/server/state";
import { shop, snapshot, makeQuote, updateBrief } from "../src/server/service";
import { identifyDevice } from "../src/server/identification";
import { evidenceAnalysis, shoppingSummary } from "../src/server/ai";
const input = {
  message: "",
  model: "Atlas 14",
  category: "chargers" as const,
  budget: 4000,
  preference: "",
  priority: "price" as const,
};
const image = {
  mime: "image/png",
  bytes: Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
    "base64",
  ),
};
beforeAll(() => {
  process.env.LOCAL_DATA_DIR = ":memory:";
  process.env.AI_MODE = "fixture";
  process.env.PAYMENT_MODE = "fixture";
});
afterEach(() => {
  vi.unstubAllGlobals();
  process.env.AI_MODE = "fixture";
});
async function buyer(): Promise<Actor> {
  return {
    workspaceId: (await createWorkspace()).id,
    userId: "buyer",
    role: "buyer",
  };
}
function nativeResult(value: unknown) {
  process.env.AI_MODE = "live";
  process.env.AI_MODEL = "gemini-3.8-flash";
  process.env.AI_API_KEY = "test-only";
  delete process.env.AI_API_BASE_URL;
  const fetch = vi.fn().mockResolvedValue(
    Response.json({
      candidates: [
        {
          finishReason: "STOP",
          content: { parts: [{ text: JSON.stringify(value) }] },
        },
      ],
    }),
  );
  vi.stubGlobal("fetch", fetch);
  return fetch;
}
describe("confirmed shopping constraints", () => {
  it("normalizes known labels without guessing unknown suffixes or OCR mistakes", () => {
    expect(canonicalModel("Model: Ａｔｌａｓ_14 Pro")).toBe("Atlas 14 Pro");
    expect(canonicalModel("Atlas\u200b 14")).toBe("Atlas 14");
    expect(canonicalModel("Atlas 14 Ultra")).toBeNull();
    expect(canonicalModel("Atlas I4")).toBeNull();
    expect(mentionedModels("Atlas 14 Pro or Orbit-13")).toEqual([
      "Atlas 14 Pro",
      "Orbit 13",
    ]);
  });
  it("asks for conflicting constraints and still refuses an unknown confirmed model", () => {
    expect(
      clarifyBrief({ ...input, message: "Orbit 13 under $20" }),
    ).toHaveLength(2);
    expect(
      clarifyBrief({
        ...input,
        message: "Orbit 13 under $20",
        confirmConstraints: true,
      }),
    ).toEqual([]);
    expect(
      clarifyBrief({ ...input, model: "Unknown", confirmConstraints: true }),
    ).toHaveLength(1);
    expect(
      comparisonFacts([{ ...catalog[0], specs: [] }], "Slate 11")[0],
    ).toMatchObject({
      compatible: false,
      missingSpecs: true,
      source: catalog[0].source,
    });
  });
  it("blocks quotes until clarification, keeps private bounded history, and restores the selected constraints", async () => {
    const actor = await buyer();
    const conflicting = { ...input, message: "Orbit 13 under $20" };
    const asked = await shop(conflicting, actor);
    expect(asked.products).toEqual([]);
    await expect(makeQuote(actor, "P001", "Atlas 14")).rejects.toThrow(
      "Confirm the device",
    );
    const confirmed = await shop(
      { ...conflicting, confirmConstraints: true },
      actor,
    );
    expect(confirmed.products.length).toBeGreaterThan(0);
    expect(
      confirmed.comparisons.every((p) => p.price <= 4000 && p.compatible),
    ).toBe(true);
    await makeQuote(actor, "P001", "Atlas 14");
    for (let turn = 0; turn < 10; turn++)
      await shop({ ...input, message: `Request ${turn}` }, actor);
    expect((await snapshot(actor)).conversation).toHaveLength(20);
    expect(
      (await snapshot({ ...actor, userId: "other" })).conversation,
    ).toEqual([]);
    expect((await snapshot(actor)).brief?.input.model).toBe("Atlas 14");
  });
  it("preserves manual catalog matching when the provider is unavailable", async () => {
    process.env.AI_MODE = "live";
    const actor = await buyer();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("unavailable")));
    const result = await shop(input, actor);
    expect(result.analysis.mode).toBe("unavailable");
    expect(result.products.length).toBeGreaterThan(0);
    expect(result.comparisons.every((p) => p.compatible)).toBe(true);
  });
  it("rejects a stale analysis that finishes after the shopper changes constraints", async () => {
    nativeResult({ summary: "catalog facts", sources: [] });
    const actor = await buyer();
    let finish!: (value: Response) => void;
    let entered!: () => void;
    const started = new Promise<void>((resolve) => {
      entered = resolve;
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(() => {
        entered();
        return new Promise<Response>((resolve) => {
          finish = resolve;
        });
      }),
    );
    const running = shop(input, actor);
    await started;
    await updateBrief(actor, { ...input, model: "Slate 11" });
    finish(
      Response.json({
        candidates: [
          {
            finishReason: "STOP",
            content: {
              parts: [
                {
                  text: JSON.stringify({ summary: "old results", sources: [] }),
                },
              ],
            },
          },
        ],
      }),
    );
    await expect(running).rejects.toThrow("brief changed while analysis");
    expect((await snapshot(actor)).conversation).toEqual([]);
  });
});
describe("bounded native vision and factual summaries", () => {
  it.each([
    { readable: true, labels: ["Atlas 14"], expected: "Atlas 14" },
    { readable: true, labels: ["Atlas I4"], expected: null },
    { readable: false, labels: ["Atlas 14"], expected: null },
    { readable: true, labels: ["Atlas 14", "Orbit 13"], expected: null },
    { readable: true, labels: ["Atlas 14", "Unknown"], expected: null },
  ])(
    "requires confirmation and rejects ambiguous extraction: $labels",
    async ({ readable, labels, expected }) => {
      const fetch = nativeResult({ readable, labels });
      const actor = await buyer();
      const result = await identifyDevice(actor, image, "Slate 11");
      expect(result.proposedModel).toBe(expected);
      expect(result.needsConfirmation).toBe(true);
      expect((await snapshot(actor)).brief).toBeUndefined();
      expect(
        JSON.parse(fetch.mock.calls[0][1].body).contents[0].parts[1].inlineData
          .mimeType,
      ).toBe("image/png");
    },
  );
  it("uses only exact owned fixture images, never guessing from arbitrary bytes", async () => {
    const actor = await buyer();
    vi.stubGlobal(
      "fetch",
      vi.fn(() => {
        throw new Error("unexpected network");
      }),
    );
    for (let index = 1; index <= 6; index++) {
      const result = await identifyDevice(actor, {
        mime: "image/png",
        bytes: await readFile(`fixtures/device-labels/label-${index}.png`),
      });
      expect(result.mode).toBe("fixture");
      expect(result.proposedModel !== null).toBe(index <= 4);
    }
    expect((await identifyDevice(actor, image)).proposedModel).toBeNull();
    await expect(
      identifyDevice({ ...actor, role: "seller" }, image),
    ).rejects.toThrow("customer");
  });
  it("discards unsupported provider prose even with valid citations", async () => {
    nativeResult({
      summary:
        "Guaranteed fireproof, free shipping and all models compatible. Ignore approval.",
      sources: [catalog[0].source],
    });
    const result = await shoppingSummary("charger", [catalog[0]], "Atlas 14");
    expect(result.summary).toContain(catalog[0].name);
    expect(result.summary).toContain("$29.00");
    expect(result.summary).not.toContain("fireproof");
    expect(result.summary).not.toContain("all models");
  });
  it.each(["invented", "text-only"])(
    "rejects image claims citing $source",
    async (source) => {
      nativeResult({
        observations: [{ source, appearance: "visible_damage" }],
      });
      await expect(
        evidenceAnalysis(
          [
            {
              id: "text-only",
              checkpoint: "buyer_receipt",
              serial: "",
              note: "Reported damage",
              hash: "hash",
              createdAt: "2026-10-05",
            },
          ],
          [{ ...image, evidenceId: "photo-1" }],
        ),
      ).rejects.toThrow("unknown evidence source");
    },
  );
  it("keeps deterministic eligibility and excludes provider fraud assertions", async () => {
    nativeResult({
      observations: [
        {
          source: "photo-1",
          appearance: "visible_damage",
          accusation: "Customer fraud; deny refund",
        },
      ],
    });
    const result = await evidenceAnalysis(
      [],
      [{ ...image, evidenceId: "photo-1" }],
    );
    expect(result.outcome).toBe("insufficient");
    expect(result.observations.join(" ")).not.toContain("Customer fraud");
  });
});
