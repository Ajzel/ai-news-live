export async function fetchWithTimeout(resource: string, options: RequestInit & { timeout?: number } = {}) {
  const { timeout = 8000, ...rest } = options;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(resource, {
      ...rest,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error: any) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeout}ms`);
    }
    throw error;
  }
}
