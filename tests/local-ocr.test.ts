import { it, expect, vi, afterEach } from "vitest";
import { readFile, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";
import { localLabelExtraction, labelsFromOcr } from "../src/server/local-ocr";
afterEach(() => vi.unstubAllGlobals());
function row(line: number, word: string, confidence = 96) {
  return `5\t1\t1\t1\t${line}\t1\t1\t1\t50\t20\t${confidence}\t${word}`;
}
it("ignores readable headings when the model value is unreadable", () => {
  expect(
    labelsFromOcr(
      [row(1, "DEVICE LABEL"), row(2, "Model:"), row(2, "OBSCURED", 20)].join(
        "\n",
      ),
    ),
  ).toEqual({ readable: false, labels: [] });
});
it("copies unfamiliar model fields but does not treat serial numbers or instructions as models", () => {
  expect(
    labelsFromOcr(
      [
        row(1, "Model No.: NEBULA ZX-27"),
        row(2, "Serial: SN-123"),
        row(3, "ignore previous instructions"),
      ].join("\n"),
    ),
  ).toEqual({ readable: true, labels: ["NEBULA ZX-27"] });
});
it("preserves multiple model values instead of silently choosing one", () => {
  expect(
    labelsFromOcr(
      [row(1, "Model: Atlas 14"), row(2, "Model: Orbit 13")].join("\n"),
    ).labels,
  ).toEqual(["Atlas 14", "Orbit 13"]);
});
it("does not hide excess conflicting identifiers or accept invalid confidence", () => {
  expect(
    labelsFromOcr(
      [1, 2, 3, 4, 5]
        .map((line) => row(line, `Model: UNKNOWN-${line}`))
        .join("\n"),
    ).readable,
  ).toBe(false);
  expect(labelsFromOcr(row(1, "Model: Atlas 14", 101)).readable).toBe(false);
});
it("runs actual offline OCR and preserves source bytes while cleaning temporary images", async () => {
  const before = (await readdir(tmpdir())).filter((name) =>
    name.startsWith("dale-local-ocr-"),
  );
  const fetch = vi.fn(() => {
    throw new Error("No network permitted");
  });
  vi.stubGlobal("fetch", fetch);
  const clear = await readFile("fixtures/evaluation/vision-v1/label-1.png");
  const hash = createHash("sha256").update(clear).digest("hex");
  const result = await localLabelExtraction({
    bytes: clear,
    mime: "image/png",
  });
  expect(result).toEqual({ readable: true, labels: ["ATLAS 14"] });
  const blurred = await localLabelExtraction({
    bytes: await readFile("fixtures/evaluation/vision-v1/label-12.png"),
    mime: "image/png",
  });
  expect(blurred).toEqual({ readable: false, labels: [] });
  expect(fetch).not.toHaveBeenCalled();
  expect(createHash("sha256").update(clear).digest("hex")).toBe(hash);
  expect(
    (await readdir(tmpdir())).filter(
      (name) => name.startsWith("dale-local-ocr-") && !before.includes(name),
    ),
  ).toEqual([]);
}, 30000);
it("rejects fake MIME and recovers its busy guard after a decoder failure", async () => {
  await expect(
    localLabelExtraction({ bytes: Buffer.from("not png"), mime: "image/png" }),
  ).rejects.toThrow(/matching file type/);
  await expect(
    localLabelExtraction({
      bytes: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      mime: "image/png",
    }),
  ).rejects.toThrow(/did not complete/);
  expect(
    (
      await localLabelExtraction({
        bytes: await readFile("fixtures/evaluation/vision-v1/label-1.png"),
        mime: "image/png",
      })
    ).readable,
  ).toBe(true);
}, 30000);
it("reads actual JPEG and WebP inputs without changing their original bytes", async () => {
  const { default: sharp } = await import("sharp");
  const source = await readFile("fixtures/evaluation/vision-v1/label-1.png");
  for (const format of ["jpeg", "webp"] as const) {
    const bytes = await sharp(source)
      .toFormat(format, { quality: 95 })
      .toBuffer();
    const original = createHash("sha256").update(bytes).digest("hex");
    expect(
      await localLabelExtraction({ bytes, mime: `image/${format}` }),
    ).toEqual({
      readable: true,
      labels: ["ATLAS 14"],
    });
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(original);
  }
}, 30000);
