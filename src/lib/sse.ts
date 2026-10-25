/** Incremental UTF-8 SSE decoder, shared by provider and browser transports. */
export async function* sseData(
  body: ReadableStream<Uint8Array>,
  signal?: AbortSignal,
): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let buffer = "",
    data: string[] = [],
    frameSize = 0;
  const onAbort = () => {
    void reader.cancel(signal?.reason).catch(() => undefined);
  };
  signal?.addEventListener("abort", onAbort, { once: true });
  try {
    for (;;) {
      signal?.throwIfAborted();
      const { value, done } = await reader.read();
      signal?.throwIfAborted();
      buffer += decoder.decode(value, { stream: !done });
      if (buffer.length > 2_000_000)
        throw new Error("Stream frame exceeded its limit.");
      let newline: number;
      while ((newline = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, newline).replace(/\r$/, "");
        buffer = buffer.slice(newline + 1);
        if (!line) {
          if (data.length) yield data.join("\n");
          data = [];
          frameSize = 0;
        } else if (line.startsWith("data:")) {
          const field = line.slice(5).replace(/^ /, "");
          frameSize += field.length;
          if (frameSize > 2_000_000)
            throw new Error("Stream frame exceeded its limit.");
          data.push(field);
        }
      }
      if (done) {
        if (buffer.trim() || data.length)
          throw new Error("Stream ended inside an unfinished frame.");
        break;
      }
    }
  } finally {
    signal?.removeEventListener("abort", onAbort);
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}
