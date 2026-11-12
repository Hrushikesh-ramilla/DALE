import { readFileSync, readdirSync } from "node:fs";
import { expect, it } from "vitest";
import { catalogManifestV2Schema } from "../src/domain/catalog-manifest";

const files = readdirSync("catalog/manifests").filter((file) =>
  file.endsWith("-v2.json"),
);

it.each(files)("validates bundled manifest %s before database startup", (file) => {
  const raw = JSON.parse(readFileSync(`catalog/manifests/${file}`, "utf8"));
  const result = catalogManifestV2Schema.safeParse(raw);
  expect(result.success, result.success ? "" : result.error.message).toBe(true);
});

it("still refuses an unreviewed product origin", () => {
  const raw = JSON.parse(
    readFileSync("catalog/manifests/phones-core-2026-10-11-v2.json", "utf8"),
  );
  raw.products[0].source = "https://unreviewed.example/product";
  const result = catalogManifestV2Schema.safeParse(raw);
  expect(result.success).toBe(false);
  if (!result.success)
    expect(result.error.issues.some((issue) =>
      issue.message.includes("Source origin is not reviewed"),
    )).toBe(true);
});
