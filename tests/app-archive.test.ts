import { createHash } from "node:crypto";
import { expect, it } from "vitest";
import { validateAppArchive } from "../scripts/validate-app-archive.mjs";
const source = "a".repeat(40);
const archive = Buffer.from("test archive");
const metadata = { source, platform: "linux", architecture: "x64", nodeMajor: 22, size: archive.length, sha256: createHash("sha256").update(archive).digest("hex") };
it("accepts only the current Linux artifact and detects changed archive bytes", () => {
  expect(validateAppArchive(metadata, archive, source)).toEqual(metadata);
  expect(() => validateAppArchive(metadata, Buffer.from("bad archive!"), source)).toThrow(/checksum|size/);
  expect(() => validateAppArchive({ ...metadata, sha256: "0".repeat(64) }, archive, source)).toThrow(/checksum/);
});
it.each([{ source: "b".repeat(40) }, { platform: "win32" }, { architecture: "arm64" }, { nodeMajor: 20 }])("rejects stale or incompatible deployment artifacts %j", (change) => {
  expect(() => validateAppArchive({ ...metadata, ...change }, archive, source)).toThrow(/current commit/);
});
