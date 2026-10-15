import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile, link, unlink } from "node:fs/promises";
import { join } from "node:path";

const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
function missing(error: unknown) {
  return (error as NodeJS.ErrnoException).code === "ENOENT";
}
async function immutableWrite(path: string, content: string) {
  const temporary = `${path}.${randomUUID()}.part`;
  await writeFile(temporary, content, { flag: "wx", mode: 0o600 });
  try {
    // Atomic no-replace publication: interrupted temporary files are never read.
    await link(temporary, path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    if ((await readFile(path, "utf8")) !== content)
      throw new Error(
        "Checkpoint identity already has different reviewed content.",
      );
  } finally {
    await unlink(temporary);
  }
}

/** Operator collection journal; it never stages or publishes catalog inventory. */
export async function catalogCheckpoint(directory: string, identity: unknown) {
  await mkdir(directory, { recursive: true });
  const input = JSON.stringify(identity);
  await immutableWrite(join(directory, "input.json"), input);
  const inputHash = digest(input);
  return {
    async get<T>(key: string): Promise<T | undefined> {
      let text: string;
      try {
        text = await readFile(join(directory, `${digest(key)}.json`), "utf8");
      } catch (error) {
        if (missing(error)) return undefined;
        throw error;
      }
      const value = JSON.parse(text) as {
        key: string;
        inputHash: string;
        payload: string;
        hash: string;
      };
      if (
        value.key !== key ||
        value.inputHash !== inputHash ||
        typeof value.payload !== "string" ||
        value.hash !== digest(value.payload)
      )
        throw new Error(
          "Checkpoint record integrity failed; operator review required.",
        );
      return JSON.parse(value.payload) as T;
    },
    async put(key: string, value: unknown) {
      const payload = JSON.stringify(value);
      await immutableWrite(
        join(directory, `${digest(key)}.json`),
        JSON.stringify({ key, inputHash, payload, hash: digest(payload) }),
      );
    },
  };
}
