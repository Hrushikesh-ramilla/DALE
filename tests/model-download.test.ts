import { afterEach, expect, it, vi } from "vitest";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { downloadModelArtifact } from "../scripts/download-model-artifact.mjs";
afterEach(() => vi.unstubAllGlobals());
const bytes = Buffer.from("pinned artifact bytes");
const sha = createHash("sha256").update(bytes).digest("hex");
it("resumes a pinned artifact from its retained byte offset before verifying the entire file", async () => {
  const directory = await mkdtemp(join(tmpdir(), "dale-model-download-"));
  try {
    const path = join(directory, "model.gguf");
    await writeFile(path + ".part", bytes.subarray(0, 6));
    const download = vi
      .fn()
      .mockResolvedValue(
        new Response(bytes.subarray(6), {
          status: 206,
          headers: {
            "Content-Range": `bytes 6-${bytes.length - 1}/${bytes.length}`,
          },
        }),
      );
    vi.stubGlobal("fetch", download);
    await downloadModelArtifact("https://example.test/model", path, sha);
    expect(download.mock.calls[0][1].headers.Range).toBe("bytes=6-");
    expect(await readFile(path)).toEqual(bytes);
    await downloadModelArtifact("https://example.test/model", path, sha);
    expect(download).toHaveBeenCalledTimes(1);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
it("preserves a mismatched completed artifact and refuses to use or overwrite it", async () => {
  const directory = await mkdtemp(join(tmpdir(), "dale-model-download-"));
  try {
    const path = join(directory, "model.gguf");
    await writeFile(path, "unexpected");
    const download = vi.fn();
    vi.stubGlobal("fetch", download);
    await expect(
      downloadModelArtifact("https://example.test/model", path, sha),
    ).rejects.toThrow("checksum differs");
    expect(download).not.toHaveBeenCalled();
    expect(await readFile(path, "utf8")).toBe("unexpected");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
