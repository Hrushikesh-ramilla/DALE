// Bounded exponential backoff for analysis only; payment retries use persisted operation IDs.
export async function fetchAnalysisWithRetry(
  url: URL,
  init: RequestInit,
  options: {
    attempts?: number;
    sleep?: (ms: number) => Promise<void>;
    random?: () => number;
  } = {},
) {
  const attempts = Math.min(4, Math.max(1, options.attempts || 4));
  const sleep =
    options.sleep ||
    ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  const random = options.random || Math.random;
  for (let attempt = 0; attempt < attempts; attempt++) {
    let response: Response;
    try {
      response = await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(20000),
      });
    } catch (error) {
      if (attempt === attempts - 1) throw error;
      await sleep(1000 * 2 ** attempt + Math.round(random() * 500));
      continue;
    }
    if (
      ![429, 500, 502, 503, 504].includes(response.status) ||
      attempt === attempts - 1
    )
      return response;
    const header = response.headers.get("retry-after");
    const retryAfter = header
      ? /^\d+$/.test(header)
        ? Number(header) * 1000
        : Math.max(0, Date.parse(header) - Date.now())
      : 0;
    // Long Retry-After values are surfaced instead of retrying earlier than the provider requests.
    if (retryAfter > 35000) return response;
    await response.body?.cancel();
    await sleep(
      Math.max(
        Number.isFinite(retryAfter) ? retryAfter : 0,
        1000 * 2 ** attempt + Math.round(random() * 500),
      ),
    );
  }
  throw new Error("Analysis retries exhausted.");
}
