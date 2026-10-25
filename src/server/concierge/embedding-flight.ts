type Flight = {
  promise: Promise<number[][]>;
  abort: AbortController;
  subscribers: number;
};
const flights = new Map<string, Flight>();
/** Identical embedding work can be shared; each shopper retains independent
 * cancellation. The underlying request is aborted only after everyone leaves. */
export function sharedEmbedding(
  key: string,
  signal: AbortSignal | undefined,
  run: (signal: AbortSignal) => Promise<number[][]>,
): Promise<number[][]> {
  signal?.throwIfAborted();
  let flight = flights.get(key);
  if (!flight || flight.abort.signal.aborted) {
    const abort = new AbortController();
    const created: Flight = {
      abort,
      subscribers: 0,
      promise: Promise.resolve().then(() => run(abort.signal)),
    };
    created.promise = created.promise.finally(() => {
      if (flights.get(key) === created) flights.delete(key);
    });
    flights.set(key, created);
    flight = created;
  }
  const active = flight;
  active.subscribers++;
  return new Promise((resolve, reject) => {
    let settled = false;
    const leave = () => {
      settled = true;
      signal?.removeEventListener("abort", onAbort);
      active.subscribers--;
      if (!active.subscribers) active.abort.abort();
    };
    const onAbort = () => {
      if (!settled) {
        leave();
        reject(signal?.reason);
      }
    };
    signal?.addEventListener("abort", onAbort, { once: true });
    active.promise.then(
      (value) => {
        if (!settled) {
          leave();
          resolve(value.map((vector) => [...vector]));
        }
      },
      (error) => {
        if (!settled) {
          leave();
          reject(error);
        }
      },
    );
    if (signal?.aborted) onAbort();
  });
}
