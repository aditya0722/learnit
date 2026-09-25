const rateLimitStore = new Map();

function cleanExpiredEntries() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore) {
    if (now - entry.windowStart > entry.windowMs) {
      rateLimitStore.delete(key);
    }
  }
}

export function createRateLimiter({ windowMs = 60000, max = 10, message = "Too many requests" } = {}) {
  return (req, res, next) => {
    cleanExpiredEntries();

    const userId = req.user?.id || req.ip;
    const key = `${userId}:${req.originalUrl}`;
    const now = Date.now();

    let entry = rateLimitStore.get(key);

    if (!entry || now - entry.windowStart > windowMs) {
      entry = { windowStart: now, count: 0, windowMs };
      rateLimitStore.set(key, entry);
    }

    entry.count++;

    const remaining = Math.max(0, max - entry.count);
    const resetTime = Math.ceil((entry.windowStart + windowMs - now) / 1000);

    res.set("X-RateLimit-Limit", String(max));
    res.set("X-RateLimit-Remaining", String(remaining));
    res.set("X-RateLimit-Reset", String(resetTime));

    if (entry.count > max) {
      return res.status(429).json({
        message: `Rate limit exceeded. Try again in ${resetTime} seconds.`,
      });
    }

    next();
  };
}

export const runCodeLimiter = createRateLimiter({
  windowMs: 60000,
  max: 10,
  message: "Too many code executions. Maximum 10 runs per minute.",
});
