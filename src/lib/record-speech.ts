import { Pcm16Encoder, speechWav } from "./voice-audio";
/** Local capture only. No browser/cloud speech-recognition service is invoked. */
export async function recordSpeech(signal: AbortSignal) {
  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia)
    throw new Error("Microphone capture needs HTTPS or localhost.");
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 },
  });
  if (signal.aborted) {
    stream.getTracks().forEach((t) => t.stop());
    throw signal.reason;
  }
  let audio: AudioContext;
  try {
    audio = new AudioContext();
  } catch (e) {
    stream.getTracks().forEach((t) => t.stop());
    throw e;
  }
  let source: MediaStreamAudioSourceNode;
  let node: AudioWorkletNode;
  let gain: GainNode;
  try {
    await audio.audioWorklet.addModule("/voice-capture.js");
    await audio.resume();
    source = audio.createMediaStreamSource(stream);
    node = new AudioWorkletNode(audio, "dale-voice-capture");
    gain = audio.createGain();
    gain.gain.value = 0;
    source.connect(node);
    node.connect(gain);
    gain.connect(audio.destination);
  } catch (e) {
    stream.getTracks().forEach((t) => t.stop());
    await audio.close();
    throw e;
  }
  const encoder = new Pcm16Encoder(audio.sampleRate);
  const chunks: Uint8Array[] = [];
  let size = 0;
  let ended = false;
  let finish!: () => void;
  const recording = new Promise<ArrayBuffer>((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timer);
      signal.removeEventListener("abort", onAbort);
      node.port.onmessage = null;
      source.disconnect();
      node.disconnect();
      gain.disconnect();
      stream.getTracks().forEach((t) => t.stop());
      void audio.close();
    };
    const onAbort = () => {
      if (ended) return;
      ended = true;
      cleanup();
      reject(signal.reason || new Error("Recording canceled"));
    };
    finish = () => {
      if (ended) return;
      ended = true;
      cleanup();
      try {
        resolve(new Uint8Array(speechWav(chunks)).buffer);
      } catch (e) {
        reject(e);
      }
    };
    const timer = setTimeout(finish, 15000);
    signal.addEventListener("abort", onAbort, { once: true });
    node.port.onmessage = (e) => {
      if (ended) return;
      const bytes = encoder
        .encode(e.data as Float32Array)
        .slice(0, Math.max(0, 15 * 32000 - size));
      if (bytes.length) {
        chunks.push(bytes);
        size += bytes.length;
      }
      if (size >= 15 * 32000) finish();
    };
    if (signal.aborted) onAbort();
  });
  return { stop: () => finish(), recording };
}
