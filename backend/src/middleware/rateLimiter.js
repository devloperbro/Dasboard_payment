const Redis = require('ioredis');
const { ApiError } = require('./errorHandler');
const config = require('../config');

// Use redis-cache (disposable LRU) — NOT the payment Redis
const redis = new Redis({
  host: config.redisCache.host,
  port: config.redisCache.port,
  password: config.redisCache.password,
  retryStrategy: (times) => Math.min(times * 50, 2000)
});

redis.on('error', (err) => {
  // Log but do not crash the process on Redis connectivity errors
  console.error('[RateLimiter] Redis-cache error:', err.message);
});

const rateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // limit each IP to 100 requests per windowMs
    keyPrefix = 'rate-limit:',
    message = 'Too many requests, please try again later.'
  } = options;

  return async (req, res, next) => {
    try {
      const key = `${keyPrefix}${req.ip}`;
      const current = await redis.incr(key);
      
      if (current === 1) {
        await redis.expire(key, Math.floor(windowMs / 1000));
      }

      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, max - current));

      if (current > max) {
        throw new ApiError(429, message);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = rateLimiter; 