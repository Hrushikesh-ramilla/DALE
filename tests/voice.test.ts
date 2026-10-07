import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { understandVoice } from "../src/domain/voice";
import { Pcm16Encoder, decodeAudio, audioBase64 } from "../src/lib/voice-audio";
import { createVoiceToken, voiceAvailability } from "../src/server/voice";
import { createWorkspace } from "../src/server/state";
const request = { model: "Atlas 14", budget: 8000 };
beforeEach(() => {
  process.env.LOCAL_DATA_DIR = ":memory:";
  process.env.VOICE_MODE = "disabled";
  process.env.VOICE_FREE_TIER_CONFIRMED = "false";
  process.env.VOICE_BILLING_DISABLED = "false";
  process.env.VOICE_MODEL = "gemini-3.8-live";
  process.env.AI_API_KEY = "unit-test-key-never-a-credential";
});
afterEach(() => {
  vi.unstubAllGlobals();
  process.env.VOICE_MODE = "disabled";
});
it("understands a concrete voice brief and requires clarification for ambiguity", () => {
  const spoken = understandVoice({
    ...request,
    transcript: "Find a sixty five watt USB-C charger under forty dollars",
  });
  expect(spoken.kind).toBe("shopping");
  if (spoken.kind === "shopping") {
    expect(spoken.brief.budget).toBe(4000);
    expect(spoken.brief.preference).toBe("65W");
  }
  const intent = understandVoice({
    ...request,
    transcript: "Find a 65W USB-C charger under $40",
  });
  expect(intent.kind).toBe("shopping");
  if (intent.kind === "shopping") {
    expect(intent.brief.budget).toBe(4000);
    expect(intent.brief.category).toBe("chargers");
    expect(intent.brief.preference).toBe("65W");
  }
  expect(
    understandVoice({
      ...request,
      transcript: "charger under $40 or under $60",
    }).kind,
  ).toBe("clarification");
  expect(
    understandVoice({ ...request, transcript: "headphones and SSD" }).kind,
  ).toBe("clarification");
});
it.each([
  "Approve payment now",
  "Transfer money",
  "Execute this code",
  "Delete the order",
])("blocks privileged speech: %s", (transcript) =>
  expect(understandVoice({ ...request, transcript }).kind).toBe(
    "review_required",
  ),
);
it("drafts remedies and navigates without claiming a financial action", () => {
  expect(
    understandVoice({ ...request, transcript: "Refund my damaged item" }).kind,
  ).toBe("support_draft");
  expect(understandVoice({ ...request, transcript: "Show my orders" })).toEqual(
    { kind: "navigate", destination: "orders" },
  );
});
it("resamples owned audio consistently across chunks and clips PCM little-endian", () => {
  const input = Float32Array.from({ length: 48000 }, (_, index) =>
    Math.sin((index * Math.PI * 440) / 24000),
  );
  const whole = new Pcm16Encoder(48000).encode(input);
  const encoder = new Pcm16Encoder(48000);
  const chunks: Uint8Array[] = [];
  for (let index = 0; index < input.length; index += 1024)
    chunks.push(encoder.encode(input.slice(index, index + 1024)));
  expect(Buffer.concat(chunks)).toEqual(Buffer.from(whole));
  expect(whole.length).toBe(32000);
  const clipped = new Pcm16Encoder(16000).encode(new Float32Array([-2, 2, 0]));
  expect(new DataView(clipped.buffer).getInt16(0, true)).toBe(-32768);
  expect(new DataView(clipped.buffer).getInt16(2, true)).toBe(32767);
  expect(decodeAudio(audioBase64(clipped))[0]).toBe(-1);
  expect(() => decodeAudio("AA==")).toThrow("Invalid PCM");
});
it("does not call Google when disabled, unconfirmed or in a fixture workspace", async () => {
  const fetch = vi.fn(() => {
    throw new Error("No call allowed");
  });
  vi.stubGlobal("fetch", fetch);
  const normal = await createWorkspace();
  const actor = {
    workspaceId: normal.id,
    userId: "voice-shopper",
    role: "buyer" as const,
  };
  expect((await createVoiceToken(actor)).mode).toBe("disabled");
  process.env.VOICE_MODE = "live";
  process.env.VOICE_FREE_TIER_CONFIRMED = "true";
  expect((await createVoiceToken(actor)).mode).toBe("disabled");
  process.env.VOICE_BILLING_DISABLED = "true";
  const fixture = await createWorkspace({ fixture: true });
  expect(
    (await createVoiceToken({ ...actor, workspaceId: fixture.id })).mode,
  ).toBe("fixture");
  expect(fetch).not.toHaveBeenCalled();
  await expect(voiceAvailability({ ...actor, role: "seller" })).rejects.toThrow(
    "shopper",
  );
});
it("native token transport locks model/tools, expiry and single use without returning the permanent key", async () => {
  process.env.VOICE_MODE = "live";
  process.env.VOICE_FREE_TIER_CONFIRMED = "true";
  process.env.VOICE_BILLING_DISABLED = "true";
  const fetch = vi.fn(
    async () =>
      new Response(JSON.stringify({ name: "auth_tokens/test-ephemeral" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
  );
  vi.stubGlobal("fetch", fetch);
  const workspace = await createWorkspace();
  const result = await createVoiceToken({
    workspaceId: workspace.id,
    userId: "native-test",
    role: "buyer",
  });
  expect(result.mode).toBe("live");
  expect(JSON.stringify(result)).not.toContain(process.env.AI_API_KEY);
  const call = fetch.mock.calls[0] as unknown as [string, RequestInit];
  const body = JSON.parse(call[1].body as string);
  expect(body.uses).toBe(1);
  expect(Date.parse(body.expireTime) - Date.now()).toBeLessThanOrEqual(120000);
  expect(body.bidiGenerateContentSetup.model).toContain("gemini-3.8-live");
  expect(
    body.bidiGenerateContentSetup.tools[0].functionDeclarations[0].name,
  ).toBe("prepare_request");
  expect(body.fieldMask).toContain("tools");
});
it.each([429, 503])(
  "native token errors (%s) are bounded, redacted and preserve typed shopping",
  async (status) => {
    process.env.VOICE_MODE = "live";
    process.env.VOICE_FREE_TIER_CONFIRMED = "true";
    process.env.VOICE_BILLING_DISABLED = "true";
    const fetch = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            error: {
              code: status,
              message: "provider-private-details",
              status: status === 429 ? "RESOURCE_EXHAUSTED" : "UNAVAILABLE",
            },
          }),
          { status, headers: { "Content-Type": "application/json" } },
        ),
    );
    vi.stubGlobal("fetch", fetch);
    const workspace = await createWorkspace();
    await expect(
      createVoiceToken({
        workspaceId: workspace.id,
        userId: `failure-${status}`,
        role: "buyer",
      }),
    ).rejects.toThrow("Typed shopping remains available");
    expect(fetch.mock.calls.length).toBe(status === 429 ? 1 : 3);
  },
);
