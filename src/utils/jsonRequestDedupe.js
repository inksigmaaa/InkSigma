const inFlightJsonRequests = new Map();

const normalizeHeaders = (headers) => {
  if (!headers) return [];

  if (typeof Headers !== "undefined" && headers instanceof Headers) {
    return Array.from(headers.entries()).sort(([a], [b]) => a.localeCompare(b));
  }

  if (Array.isArray(headers)) {
    return [...headers].sort(([a], [b]) => String(a).localeCompare(String(b)));
  }

  return Object.entries(headers).sort(([a], [b]) => a.localeCompare(b));
};

export const buildGetJsonDedupeKey = (url, options = {}) => {
  const method = (options.method || "GET").toUpperCase();
  if (method !== "GET") return null;

  return JSON.stringify({
    method,
    url,
    headers: normalizeHeaders(options.headers),
  });
};

export const dedupeJsonRequest = (key, requestFn) => {
  if (!key) return requestFn();

  const existingRequest = inFlightJsonRequests.get(key);
  if (existingRequest) return existingRequest;

  const request = Promise.resolve()
    .then(requestFn)
    .finally(() => {
      inFlightJsonRequests.delete(key);
    });

  inFlightJsonRequests.set(key, request);
  return request;
};
