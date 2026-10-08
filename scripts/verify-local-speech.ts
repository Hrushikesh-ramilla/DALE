import "dotenv/config";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { transcribeLocalSpeech } from "../src/server/local-speech";
if (process.argv.includes("--prepared")) {
  const config = JSON.parse(
    await readFile(".data/self-hosted/speech/config.json", "utf8"),
  );
  process.env.LOCAL_SPEECH_EXECUTABLE = config.executable;
  process.env.LOCAL_SPEECH_MODEL = config.model;
  process.env.VOICE_MODE = "local";
}
const manifest = JSON.parse(
  await readFile("fixtures/voice-v1/manifest.json", "utf8"),
);
const results: {
  file: string;
  passed: boolean;
  durationMs: number;
  transcript?: string;
  failure?: string;
}[] = [];
const normalize = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
for (const item of manifest.cases) {
  const start = performance.now();
  try {
    const bytes = await readFile(`fixtures/voice-v1/${item.file}`);
    if (createHash("sha256").update(bytes).digest("hex") !== item.sha256)
      throw new Error("Fixture integrity mismatch");
    const result = await transcribeLocalSpeech(bytes);
    results.push({
      file: item.file,
      transcript: result.transcript,
      passed: normalize(result.transcript) === item.expected,
      durationMs: Math.round(performance.now() - start),
    });
  } catch {
    results.push({
      file: item.file,
      passed: false,
      failure:
        "Runtime, fixture integrity or recognition failed; private diagnostics withheld",
      durationMs: Math.round(performance.now() - start),
    });
  }
}
const report = {
  checkedAt: new Date().toISOString(),
  model: "Whisper tiny multilingual",
  corpus: manifest.version,
  passed: results.every((result) => result.passed),
  results,
  limitation:
    manifest.provenance +
    " CPU on local laptop; not EC2 latency or human acceptance.",
};
await mkdir(".data/reports", { recursive: true });
await writeFile(
  ".data/reports/local-speech.json",
  JSON.stringify(report, null, 2),
);
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exitCode = 1;
