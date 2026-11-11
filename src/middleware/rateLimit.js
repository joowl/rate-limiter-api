const rateLimiting = require('../algorithms/rateLimiting');

function rateLimit({ endpoint, store }) { // endpoint: key into the client's config (e.g. "foo") and part of the storage key
  return async (req, res, next) => {
    try {
      const config = req.clientConfig[endpoint];
      const key = `${endpoint}:${req.clientId}`;
      const t = Date.now();

      const result = await store.update(key, (state) => rateLimiting.consume(state, t, config));

      res.set('X-RateLimit-Remaining', String(result.remaining));
      if (!result.allowed) {
        res.set('Retry-After', String(Math.ceil(result.retryAfterMs / 1000)));
        return res.status(429).json({ error: 'rate limit exceeded' });
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = rateLimit;
