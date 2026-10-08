// A persistent startup error must not become an endless restart loop.
export function nextPreviewRecovery(failures, now) {
  const recent = failures.filter((time) => now - time < 60_000);
  recent.push(now);
  return {
    failures: recent,
    exhausted: recent.length > 3,
    delay: Math.min(1000 * 2 ** (recent.length - 1), 4000),
  };
}
