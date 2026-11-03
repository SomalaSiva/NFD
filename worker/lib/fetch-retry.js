const DEFAULT_RETRYABLE_STATUSES = new Set([408, 500, 502, 503, 504]);

function retryDelay(response, retryIndex, baseDelayMs, maxDelayMs, now) {
  const retryAfter = response?.headers?.get("retry-after");
  if (retryAfter) {
    const seconds = Number(retryAfter);
    const retryAt = Number.isFinite(seconds) ? now() + seconds * 1000 : Date.parse(retryAfter);
    if (Number.isFinite(retryAt)) {
      return Math.min(maxDelayMs, Math.max(0, retryAt - now()));
    }
  }
  return Math.min(maxDelayMs, baseDelayMs * 2 ** retryIndex);
}

export async function fetchWithRetry(fetcher, input, init, options = {}) {
  const {
    maxAttempts = 3,
    baseDelayMs = 300,
    maxDelayMs = 1500,
    retryableStatuses = DEFAULT_RETRYABLE_STATUSES,
    sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay)),
    now = Date.now,
  } = options;
  const attempts = Math.max(1, Math.floor(maxAttempts));

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    if (init?.signal?.aborted) throw init.signal.reason || new DOMException("Aborted", "AbortError");

    let response;
    try {
      response = await fetcher(input, init);
    } catch (error) {
      if (attempt === attempts || init?.signal?.aborted) throw error;
      await sleep(Math.min(maxDelayMs, baseDelayMs * 2 ** (attempt - 1)));
      continue;
    }

    if (!retryableStatuses.has(response.status) || attempt === attempts) return response;
    try {
      await response.body?.cancel();
    } catch {
      // A response may already have closed; the next request can still proceed.
    }
    await sleep(retryDelay(response, attempt - 1, baseDelayMs, maxDelayMs, now));
  }

  throw new Error("Request could not complete");
}
