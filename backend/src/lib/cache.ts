/**
 * Wraps an async function with an in-memory cache.
 * - Fresh (younger than ttlMs): returned instantly.
 * - Stale: returned instantly while a refresh runs in the background.
 * - Concurrent callers share a single in-flight refresh.
 * - If a refresh fails, the last good value keeps being served.
 */
export function cachedAsync<T>(fn: () => Promise<T>, ttlMs: number): () => Promise<T> {
  let value: T | undefined;
  let fetchedAt = 0;
  let inflight: Promise<T> | null = null;

  const refresh = (): Promise<T> => {
    if (!inflight) {
      inflight = fn()
        .then(v => {
          value = v;
          fetchedAt = Date.now();
          return v;
        })
        .finally(() => {
          inflight = null;
        });
    }
    return inflight;
  };

  return async () => {
    if (value !== undefined) {
      if (Date.now() - fetchedAt >= ttlMs) {
        refresh().catch(err => console.error('Background refresh failed:', err));
      }
      return value;
    }
    return refresh();
  };
}
