import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const directory = ".data/self-hosted";
await mkdir(directory, { recursive: true });
const file = `${directory}/bge-small-en-v1.5-q8_0.gguf`;
const expected =
  "f046db1dc724cf4f6f0a0c5917e922823b73eb1d27b8f9a9c2797f7866974804";
let bytes;
try {
  bytes = await readFile(file);
} catch {
  const response = await fetch(
    "https://huggingface.co/ggml-org/bge-small-en-v1.5-Q8_0-GGUF/resolve/f2068edd9b54f2a369549ccc71f70ed273a2a801/bge-small-en-v1.5-q8_0.gguf",
    { signal: AbortSignal.timeout(120000) },
  );
  if (!response.ok) throw new Error(`Model download HTTP ${response.status}`);
  bytes = Buffer.from(await response.arrayBuffer());
}
if (createHash("sha256").update(bytes).digest("hex") !== expected)
  throw new Error("Embedding model checksum mismatch; no model installed.");
await writeFile(file, bytes);
console.log(
  "Verified BGE small English v1.5 Q8_0: 36,685,152 bytes. Source MIT license: https://huggingface.co/BAAI/bge-small-en-v1.5",
);
