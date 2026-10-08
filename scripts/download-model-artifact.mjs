import { createReadStream, createWriteStream } from "node:fs";
import { stat, rename, unlink } from "node:fs/promises";
import { createHash } from "node:crypto";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

async function digest(path) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest("hex");
}
export async function downloadModelArtifact(url, path, expectedHash) {
  try {
    if ((await digest(path)) === expectedHash) return;
    throw new Error(
      "Existing artifact checksum differs; preserve and inspect it before retrying.",
    );
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  const partial = `${path}.part`;
  for (let attempt = 0; attempt < 3; attempt++) {
    const offset = await stat(partial)
      .then((s) => s.size)
      .catch((e) => {
        if (e.code === "ENOENT") return 0;
        throw e;
      });
    try {
      const response = await fetch(url, {
        headers: offset ? { Range: `bytes=${offset}-` } : {},
        signal: AbortSignal.timeout(900000),
      });
      if (!response.ok || !response.body)
        throw new Error(`Artifact download returned HTTP ${response.status}.`);
      const resumed = offset > 0 && response.status === 206;
      if (
        resumed &&
        !response.headers.get("content-range")?.startsWith(`bytes ${offset}-`)
      )
        throw new Error("Unexpected artifact byte range.");
      await pipeline(
        Readable.fromWeb(response.body),
        createWriteStream(partial, { flags: resumed ? "a" : "w" }),
      );
      if ((await digest(partial)) !== expectedHash) {
        await unlink(partial);
        throw new Error("Downloaded artifact checksum failed.");
      }
      await rename(partial, path);
      return;
    } catch (error) {
      if (attempt === 2) throw error;
      console.log(
        `Artifact download interrupted; bounded retry ${attempt + 1}/2.`,
      );
      await new Promise((done) => setTimeout(done, 1000 * 2 ** attempt));
    }
  }
}
