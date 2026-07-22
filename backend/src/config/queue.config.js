const Queue = require('bull');
const { logger } = require('../utils/logger');
const config = require('./index');

// Payment Redis — durable, AOF, NO LRU eviction of queue keys
// Maps to redis-payment Docker service
const paymentRedisOpts = {
  redis: {
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
    retryStrategy: (times) => {
      const delay = Math.min(times * 100, 3000);
      logger.info(`[payment-redis] Reconnect attempt ${times}, delay ${delay}ms`);
      return delay;
    },
    maxRetriesPerRequest: 3
  }
};

// Default job options — fix unbounded Redis growth
// removeOnComplete: keep last 100 completed jobs for inspection
// removeOnFail: keep last 200 failed jobs for debugging/alerting
// Permanent audit history stays in MongoDB, NOT Redis
const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 5000 },
  removeOnComplete: 100,
  removeOnFail: 200
};

logger.info('[queue] Initializing Bull payment queue', {
  host: config.redis.host,
  port: config.redis.port
});

let payinQueue;

try {
  payinQueue = new Queue('payin', paymentRedisOpts);
  logger.info('[queue] Bull payin queue created');
} catch (error) {
  logger.error('[queue] Failed to create Bull queue:', { error: error.message });
  throw error;
}

payinQueue.on('error',   (err) => logger.error('[queue] Queue error:', { error: err.message }));
payinQueue.on('failed',  (job, err) => logger.error('[queue] Job failed:', { jobId: job.id, attempt: job.attemptsMade, error: err.message }));
payinQueue.on('stalled', (job) => logger.warn('[queue] Job stalled:', { jobId: job.id }));
payinQueue.on('ready',   () => logger.info('[queue] Payin queue ready'));
payinQueue.on('active',  (job) => logger.info('[queue] Job started:', { jobId: job.id }));

module.exports = { payinQueue, DEFAULT_JOB_OPTIONS };
 