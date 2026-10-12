// Dedicated process: only local pinned files, no customer URL or provider key.
import { createWorker } from "tesseract.js";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { createHash } from "node:crypto";
const require = createRequire(import.meta.url);
const data = resolve(
  dirname(require.resolve("@tesseract.js-data/eng")),
  "4.0.0_best_int",
);
let worker;
try {
  const compressed = await readFile(resolve(data, "eng.traineddata.gz"));
  if (
    createHash("sha256").update(compressed).digest("hex") !==
    "45b4cb346724ac1774f1c36f42f182b887bcdb28ebe63e6fff90ac41f3fcff91"
  )
    throw new Error("Pinned local language data mismatch.");
  const image = await readFile(process.argv[2]);
  worker = await createWorker("eng", 1, {
    langPath: data,
    gzip: true,
    cacheMethod: "none",
    errorHandler: () => {},
  });
  const result = await worker.recognize(image, {}, { tsv: true, text: false });
  process.stdout.write(JSON.stringify({ tsv: result.data.tsv }));
} catch {
  process.stderr.write("Local OCR did not complete.\n");
  process.exitCode = 1;
} finally {
  if (worker) await worker.terminate();
}
