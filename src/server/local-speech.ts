import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { isAbsolute, resolve, sep } from "node:path";
import { promisify } from "node:util";
const execute = promisify(execFile);
let busy = false;
export const maximumSpeechBytes = 44 + 15 * 16000 * 2;
export function localSpeechConfiguration() {
  const executable = process.env.LOCAL_SPEECH_EXECUTABLE;
  const model = process.env.LOCAL_SPEECH_MODEL;
  return process.env.VOICE_MODE === "local" &&
    executable &&
    model &&
    isAbsolute(executable) &&
    isAbsolute(model)
    ? { executable, model }
    : null;
}
export function validateSpeechWav(bytes: Buffer) {
  if (
    bytes.length < 44 + 3200 ||
    bytes.length > maximumSpeechBytes ||
    bytes.toString("ascii", 0, 4) !== "RIFF" ||
    bytes.readUInt32LE(4) !== bytes.length - 8 ||
    bytes.toString("ascii", 8, 12) !== "WAVE" ||
    bytes.toString("ascii", 12, 16) !== "fmt " ||
    bytes.readUInt32LE(16) !== 16 ||
    bytes.readUInt16LE(20) !== 1 ||
    bytes.readUInt16LE(22) !== 1 ||
    bytes.readUInt32LE(24) !== 16000 ||
    bytes.readUInt32LE(28) !== 32000 ||
    bytes.readUInt16LE(32) !== 2 ||
    bytes.readUInt16LE(34) !== 16 ||
    bytes.toString("ascii", 36, 40) !== "data" ||
    bytes.readUInt32LE(40) !== bytes.length - 44 ||
    (bytes.length - 44) % 2 !== 0
  )
    throw new Error(
      "Use a mono 16 kHz PCM16 WAV recording of at most 15 seconds.",
    );
  let energy = 0;
  for (let offset = 44; offset < bytes.length; offset += 2)
    energy += bytes.readInt16LE(offset) ** 2;
  if (Math.sqrt(energy / ((bytes.length - 44) / 2)) < 25)
    throw new Error("No audible speech was recorded. Please try again.");
}
export async function transcribeLocalSpeech(
  bytes: Buffer,
  signal?: AbortSignal,
) {
  const config = localSpeechConfiguration();
  if (!config)
    throw new Error("Local microphone recognition is not configured.");
  validateSpeechWav(bytes);
  if (busy)
    throw new Error("Speech recognition is busy. Please retry shortly.");
  busy = true;
  let temporary: string | undefined;
  const root = resolve(
    process.env.LOCAL_DATA_DIR || ".data",
    "speech-temporary",
  );
  try {
    await mkdir(root, { recursive: true, mode: 0o700 });
    temporary = await mkdtemp(resolve(root, "request-"));
    const input = resolve(temporary, "input.wav");
    const output = resolve(temporary, "transcript");
    await writeFile(input, bytes, { mode: 0o600 });
    await execute(
      config.executable,
      [
        "-m",
        config.model,
        "-f",
        input,
        "-l",
        "auto",
        "-t",
        "2",
        "-nt",
        "-np",
        "-otxt",
        "-of",
        output,
      ],
      {
        windowsHide: true,
        timeout: 60000,
        maxBuffer: 65536,
        signal,
      },
    );
    const transcript = (await readFile(output + ".txt", "utf8")).trim();
    if (
      !transcript ||
      transcript.length > 2000 ||
      /\[(?:BLANK_AUDIO|SILENCE)\]/i.test(transcript)
    )
      throw new Error("No usable transcript.");
    return {
      transcript,
      model: "Whisper tiny multilingual",
      mode: "local" as const,
    };
  } catch {
    throw new Error(
      "Local speech recognition did not complete. No cloud fallback was attempted.",
    );
  } finally {
    try {
      if (temporary && temporary.startsWith(root + sep))
        await rm(temporary, { recursive: true, force: true });
    } finally {
      busy = false;
    }
  }
}
