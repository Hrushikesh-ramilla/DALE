export class Pcm16Encoder {
  private pending = new Float32Array(0);
  private offset = 0;
  constructor(private sampleRate: number) {
    if (sampleRate < 16000 || sampleRate > 192000)
      throw new Error("Unsupported audio sample rate");
  }
  encode(input: Float32Array): Uint8Array {
    const samples = new Float32Array(this.pending.length + input.length);
    samples.set(this.pending);
    samples.set(input, this.pending.length);
    const output: number[] = [];
    const ratio = this.sampleRate / 16000;
    while (this.offset + 1 < samples.length) {
      const index = Math.floor(this.offset);
      const part = this.offset - index;
      const value = Math.max(
        -1,
        Math.min(1, samples[index] * (1 - part) + samples[index + 1] * part),
      );
      output.push(Math.round(value * (value < 0 ? 32768 : 32767)));
      this.offset += ratio;
    }
    const consumed = Math.min(Math.floor(this.offset), samples.length);
    this.pending = samples.slice(consumed);
    this.offset -= consumed;
    const bytes = new Uint8Array(output.length * 2);
    const view = new DataView(bytes.buffer);
    output.forEach((value, index) => view.setInt16(index * 2, value, true));
    return bytes;
  }
}
export function audioBase64(bytes: Uint8Array) {
  let text = "";
  for (const byte of bytes) text += String.fromCharCode(byte);
  return btoa(text);
}
export function decodeAudio(data: string): Float32Array {
  const binary = atob(data);
  if (binary.length % 2) throw new Error("Invalid PCM audio");
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++)
    bytes[index] = binary.charCodeAt(index);
  const view = new DataView(bytes.buffer);
  const output = new Float32Array(bytes.length / 2);
  for (let index = 0; index < output.length; index++)
    output[index] = view.getInt16(index * 2, true) / 32768;
  return output;
}
