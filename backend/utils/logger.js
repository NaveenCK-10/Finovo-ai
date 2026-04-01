export default {
  info: (message, ...args) => {
    console.log(`[INFO] [${new Date().toISOString()}] ${message}`, ...args);
  },
  warn: (message, ...args) => {
    console.warn(`[WARN] [${new Date().toISOString()}] ${message}`, ...args);
  },
  error: (message, error) => {
    console.error(`[ERROR] [${new Date().toISOString()}] ${message}`, error ? error.message || error : '');
  },

  // Part 4.1+4.2 — Structured request + response-time middleware
  request: (req, res, next) => {
    const start = Date.now();
    const uid = req.headers['x-user-uid'] || 'anonymous';
    const endpoint = req.originalUrl;

    console.log(`[AI REQUEST] [${new Date().toISOString()}] uid: ${uid} | endpoint: ${endpoint} | method: ${req.method}`);

    // Intercept response finish to log latency
    res.on('finish', () => {
      const ms = Date.now() - start;
      console.log(`[AI RESPONSE] [${new Date().toISOString()}] uid: ${uid} | endpoint: ${endpoint} | status: ${res.statusCode} | ${ms}ms`);
    });

    next();
  }
};
