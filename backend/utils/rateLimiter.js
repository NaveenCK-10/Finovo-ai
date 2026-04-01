// Part 4.4 — Lightweight in-memory per-user rate limiter
// Allows 1 request per second per user (configurable)

const WINDOW_MS = 1000; // 1 second window
const MAX_REQUESTS = 1; // max requests per window per user

const requestMap = new Map(); // uid => { count, windowStart }

export function rateLimitByUser(req, res, next) {
  // Extract uid from the custom header set by frontend
  const uid = req.headers['x-user-uid'];

  // Skip rate limiting for anonymous/unauthenticated (handled by Firestore rules)
  if (!uid || uid === 'anonymous') return next();

  const now = Date.now();
  const entry = requestMap.get(uid);

  if (!entry || now - entry.windowStart >= WINDOW_MS) {
    // New window — reset counter
    requestMap.set(uid, { count: 1, windowStart: now });
    return next();
  }

  if (entry.count < MAX_REQUESTS) {
    entry.count += 1;
    return next();
  }

  // Too many requests
  return res.status(429).json({
    success: false,
    data: null,
    error: 'Too many requests. Please wait a moment before sending another message.'
  });
}

// Cleanup stale entries every 60 seconds to avoid memory growth
setInterval(() => {
  const now = Date.now();
  for (const [uid, entry] of requestMap.entries()) {
    if (now - entry.windowStart >= WINDOW_MS * 10) {
      requestMap.delete(uid);
    }
  }
}, 60000);
