const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000);
const MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX || 120);

const hits = new Map();

const getKey = (req) => {
  const ip = req.headers["x-forwarded-for"] || req.socket?.remoteAddress;
  return String(ip || "unknown");
};

export const rateLimitMiddleware = (req, res, next) => {
  const key = getKey(req);
  const now = Date.now();

  const entry = hits.get(key);
  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return next();
  }

  if (entry.count >= MAX_REQUESTS) {
    const retryAfter = Math.max(0, Math.ceil((entry.resetAt - now) / 1000));
    res.setHeader("Retry-After", retryAfter);
    return res.status(429).json({ error: "Too many requests" });
  }

  entry.count += 1;
  return next();
};
