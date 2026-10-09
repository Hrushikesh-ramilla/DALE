import { execFile } from "node:child_process";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, join, dirname, basename } from "node:path";
import { promisify } from "node:util";
import { z } from "zod";
import { canonicalModel } from "../domain/identification";
import { validateImage } from "./storage";
let active = false;

export function labelsFromOcr(tsv: string) {
  const lines = new Map<string, { words: string[]; confidence: number[] }>();
  for (const row of tsv.split(/\r?\n/)) {
    const cells = row.split("\t");
    if (cells.length < 12 || cells[0] !== "5") continue;
    const confidence = Number(cells[10]);
    if (!Number.isFinite(confidence) || confidence < 0 || confidence > 100)
      continue;
    const text = cells.slice(11).join(" ").trim();
    if (!text || text.length > 160) continue;
    const key = cells.slice(1, 5).join(":");
    const line = lines.get(key) || { words: [], confidence: [] };
    line.words.push(text);
    line.confidence.push(confidence);
    lines.set(key, line);
  }
  const labels: string[] = [];
  for (const line of lines.values()) {
    const text = line.words.join(" ").trim();
    const field = text.match(
      /^(?:device\s+)?model(?:\s+(?:no\.?|number))?\s*[:#]\s*(.+)$/i,
    );
    const candidate = (
      field
        ? field[1].split(/\s+serial(?:\s+(?:no\.?|number))?\s*[:#]/i)[0]
        : text
    ).trim();
    const valueStart = field ? text.indexOf(field[1]) : 0;
    const valueEnd = valueStart + candidate.length;
    let offset = 0;
    const valueConfidence = line.words.flatMap((word, index) => {
      const start = offset;
      offset += word.length + 1;
      return start < valueEnd && offset - 1 > valueStart
        ? [line.confidence[index]]
        : [];
    });
    if (
      !candidate ||
      candidate.length > 80 ||
      !valueConfidence.length ||
      Math.min(...valueConfidence) < 85
    )
      continue;
    // Headings/ordinary text cannot become an ID. Unknown values need an
    // explicit model field. Confidence is an OCR score, not physical proof.
    if (!field && !canonicalModel(candidate)) continue;
    if (
      !labels.some((label) => label.toLowerCase() === candidate.toLowerCase())
    )
      labels.push(candidate);
  }
  return labels.length && labels.length <= 4
    ? { readable: true, labels }
    : { readable: false, labels: [] };
}

export async function localLabelExtraction(image: {
  bytes: Buffer;
  mime: string;
}) {
  if (active)
    throw new Error(
      "Local label reader is busy. Select the device manually or retry.",
    );
  validateImage(image.bytes, image.mime);
  active = true;
  let directory: string | undefined;
  try {
    const { default: sharp } = await import("sharp");
    const metadata = await sharp(image.bytes, {
      limitInputPixels: 16_000_000,
    }).metadata();
    if (
      !metadata.width ||
      !metadata.height ||
      metadata.width * metadata.height > 16_000_000
    )
      throw new Error("Label image is too large.");
    // Normalize formats/orientation only for the ephemeral OCR input. The
    // caller's original bytes remain intact for provenance and human review.
    const pixels = await sharp(image.bytes, { limitInputPixels: 16_000_000 })
      .rotate()
      .png()
      .toBuffer();
    directory = await mkdtemp(join(tmpdir(), "dale-local-ocr-"));
    const input = resolve(directory, "image");
    await writeFile(input, pixels, { mode: 0o600, flag: "wx" });
    const runtimeRoot =
      process.argv[1] && basename(process.argv[1]) === "server.js"
        ? dirname(resolve(process.argv[1]))
        : process.cwd();
    const child = await promisify(execFile)(
      process.execPath,
      [
        "--max-old-space-size=128",
        resolve(runtimeRoot, "deploy/local-ocr.mjs"),
        input,
      ],
      {
        timeout: 25000,
        killSignal: "SIGKILL",
        maxBuffer: 1024 * 1024,
        windowsHide: true,
        encoding: "utf8",
        env: {
          NODE_ENV: process.env.NODE_ENV || "production",
          PATH: process.env.PATH,
          SystemRoot: process.env.SystemRoot,
          TEMP: tmpdir(),
          TMP: tmpdir(),
          OMP_THREAD_LIMIT: "1",
          OMP_NUM_THREADS: "1",
        },
      },
    );
    const output = z
      .object({ tsv: z.string().max(1024 * 1024) })
      .parse(JSON.parse(child.stdout));
    return labelsFromOcr(output.tsv);
  } catch {
    throw new Error(
      "Local label reading did not complete. Select the device manually.",
    );
  } finally {
    try {
      if (directory) {
        const target = resolve(directory);
        if (
          dirname(target) !== resolve(tmpdir()) ||
          !basename(target).startsWith("dale-local-ocr-")
        )
          throw new Error("Invalid local OCR cleanup directory.");
        await rm(target, { recursive: true, force: true });
      }
    } finally {
      active = false;
    }
  }
}
