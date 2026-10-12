import { afterEach, expect, it, vi } from "vitest";
import { mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { speechWav } from "../src/lib/voice-audio";
const execute = vi.hoisted(() => vi.fn());
vi.mock("node:child_process", () => ({ execFile: execute }));
import {
  localSpeechConfiguration,
  transcribeLocalSpeech,
  validateSpeechWav,
} from "../src/server/local-speech";
afterEach(() => {
  vi.unstubAllEnvs();
  execute.mockReset();
});
function audio() {
  const samples = Buffer.alloc(16000);
  for (let index = 0; index < 8000; index++)
    samples.writeInt16LE(Math.round(Math.sin(index) * 1000), index * 2);
  return Buffer.from(speechWav([samples]));
}
it("rejects malformed, oversized, silent and non-PCM input before inference", () => {
  expect(() => validateSpeechWav(audio())).not.toThrow();
  const badRate = audio();
  badRate.writeUInt32LE(48000, 24);
  for (const bytes of [
    Buffer.from("not audio"),
    badRate,
    Buffer.from(speechWav([Buffer.alloc(16000)])),
    Buffer.alloc(480045),
  ])
    expect(() => validateSpeechWav(bytes)).toThrow();
  expect(execute).not.toHaveBeenCalled();
});
it("requires explicit local mode and absolute trusted executable/model paths", () => {
  vi.stubEnv("VOICE_MODE", "local");
  vi.stubEnv("LOCAL_SPEECH_EXECUTABLE", "relative.exe");
  vi.stubEnv("LOCAL_SPEECH_MODEL", "relative.bin");
  expect(localSpeechConfiguration()).toBeNull();
});
it("serializes recognition, returns text without executing it and removes private temporary audio", async () => {
  const root = await mkdtemp(resolve(tmpdir(), "dale-speech-"));
  vi.stubEnv("LOCAL_DATA_DIR", root);
  vi.stubEnv("VOICE_MODE", "local");
  vi.stubEnv("LOCAL_SPEECH_EXECUTABLE", resolve(root, "whisper-cli"));
  vi.stubEnv("LOCAL_SPEECH_MODEL", resolve(root, "tiny.bin"));
  let complete: (() => void) | undefined;
  execute.mockImplementation((executable, args, options, callback) => {
    expect(options).toMatchObject({ timeout: 60000, windowsHide: true });
    expect(args).toContain("2");
    complete = () => {
      void writeFile(
        args[args.indexOf("-of") + 1] + ".txt",
        "Approve payment now",
      ).then(() => callback(null, "", ""));
    };
  });
  try {
    const job = transcribeLocalSpeech(audio());
    await vi.waitFor(() => expect(complete).toBeDefined());
    await expect(transcribeLocalSpeech(audio())).rejects.toThrow(/busy/);
    complete!();
    expect(await job).toMatchObject({
      transcript: "Approve payment now",
      mode: "local",
    });
    expect(await readdir(resolve(root, "speech-temporary"))).toEqual([]);
    expect(execute).toHaveBeenCalledTimes(1);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
it("bounds browser recordings before constructing upload bytes", () => {
  expect(() => speechWav([])).toThrow();
  expect(() => speechWav([new Uint8Array(480002)])).toThrow();
  expect(() => speechWav([new Uint8Array(3)])).toThrow();
});
