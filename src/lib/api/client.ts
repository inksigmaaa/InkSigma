// Lightweight fetch helper with retry/backoff for the public site's
// eventually-consistent reads (e.g. just-published content during custom-domain
// propagation). The former axios client + React Query layer that lived here was
// removed during the data-layer consolidation onto Zustand + services; the only
// consumed export was `fetchJsonWithRetry`.

const createAbortError = () => {
  const error = new Error('Aborted');
  error.name = 'AbortError';
  return error;
};

const delay = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(createAbortError());
      return;
    }

    const timeoutId = setTimeout(() => {
      if (signal) {
        signal.removeEventListener('abort', handleAbort);
      }
      resolve();
    }, ms);

    const handleAbort = () => {
      clearTimeout(timeoutId);
      if (signal) {
        signal.removeEventListener('abort', handleAbort);
      }
      reject(createAbortError());
    };

    if (signal) {
      signal.addEventListener('abort', handleAbort, { once: true });
    }
  });

const readErrorMessage = async (response: Response) => {
  try {
    const data = await response.json();
    return data?.error || data?.message || response.statusText;
  } catch {
    try {
      const text = await response.text();
      return text || response.statusText;
    } catch {
      return response.statusText;
    }
  }
};

export async function fetchJsonWithRetry(
  url: string,
  fetchOptions: RequestInit = {},
  {
    attempts = 4,
    delayMs = 300,
    retryOnStatuses = [404, 408, 425, 429, 500, 502, 503, 504],
  }: {
    attempts?: number;
    delayMs?: number;
    retryOnStatuses?: number[];
  } = {},
) {
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    if (fetchOptions.signal?.aborted) {
      throw createAbortError();
    }

    try {
      const response = await fetch(url, fetchOptions);

      if (response.ok) {
        return await response.json();
      }

      const message = await readErrorMessage(response);
      const error = new Error(message || 'Request failed') as Error & { status?: number };
      error.status = response.status;
      lastError = error;

      if (attempt === attempts || !retryOnStatuses.includes(response.status)) {
        throw error;
      }
    } catch (error) {
      if ((error as Error | undefined)?.name === 'AbortError') {
        throw error;
      }

      lastError = error;
      if (attempt === attempts) {
        throw error;
      }
    }

    await delay(delayMs * attempt, fetchOptions.signal);
  }

  throw lastError || new Error('Request failed');
}
