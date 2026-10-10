class DaleVoiceCapture extends AudioWorkletProcessor {
  constructor() {
    super();
    this.frames = [];
    this.length = 0;
  }
  process(inputs) {
    const input = inputs[0]?.[0];
    if (!input) return true;
    this.frames.push(input.slice());
    this.length += input.length;
    if (this.length >= 2048) {
      const joined = new Float32Array(this.length);
      let offset = 0;
      for (const frame of this.frames) {
        joined.set(frame, offset);
        offset += frame.length;
      }
      this.port.postMessage(joined, [joined.buffer]);
      this.frames = [];
      this.length = 0;
    }
    return true;
  }
}
registerProcessor("dale-voice-capture", DaleVoiceCapture);
