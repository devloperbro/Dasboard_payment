require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const { logger, stream } = require('./utils/logger');
const { captureResponseBody, measureProcessingTime, logApiRequest } = require('./middleware/apiLogger.middleware');
const helmet = require('helmet');
const { sequelize } = require('./config/database');
const config = require('./config');
const mustChangePassword = require('./middleware/mustChangePassword');

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const agentRoutes = require('./routes/agent.routes');
const adminRoutes = require('./routes/admin.routes');
const paymentRoutes = require('./routes/payment.routes');
const paymentProviderRoutes = require('./routes/paymentProvider.routes');

// API process does NOT load Bull processors.
// Worker is a separate process/container: npm run start:worker
// This ensures API crashes do not affect job processing and vice versa.

const app = express();

// Connect to MongoDB
mongoose.connect(config.mongodb.uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => logger.info('Connected to MongoDB'))
.catch(err => logger.error('MongoDB connection error:', err));

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(morgan('combined', { stream }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API logging middleware
app.use(captureResponseBody);
app.use(measureProcessingTime);
app.use(logApiRequest);

// Force password change check (after auth, before business routes)
// Applied globally; the change-password endpoint itself is excluded inside the middleware
app.use(mustChangePassword);

// Health endpoints — placed before API routes so they never require auth
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/ready', async (req, res) => {
  const checks = {};
  let allOk = true;

  try {
    await sequelize.authenticate();
    checks.mysql = 'ok';
  } catch (e) {
    checks.mysql = 'error';
    allOk = false;
  }

  checks.mongodb = mongoose.connection.readyState === 1 ? 'ok' : 'error';
  if (checks.mongodb === 'error') allOk = false;

  // Check payment Redis (critical — Bull queue)
  try {
    const Redis = require('ioredis');
    const paymentRedis = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      connectTimeout: 3000,
      lazyConnect: true
    });
    await paymentRedis.connect();
    await paymentRedis.ping();
    await paymentRedis.disconnect();
    checks.redis_payment = 'ok';
  } catch (e) {
    checks.redis_payment = 'error';
    allOk = false;
  }

  // redis-cache failure is NOT fatal — rate limiting degrades gracefully
  try {
    const Redis = require('ioredis');
    const cacheRedis = new Redis({
      host: config.redisCache.host,
      port: config.redisCache.port,
      password: config.redisCache.password,
      connectTimeout: 3000,
      lazyConnect: true
    });
    await cacheRedis.connect();
    await cacheRedis.ping();
    await cacheRedis.disconnect();
    checks.redis_cache = 'ok';
  } catch (e) {
    checks.redis_cache = 'degraded';   // not fatal
  }

  res.status(allOk ? 200 : 503).json({
    status: allOk ? 'ok' : 'degraded',
    checks
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin/payment-providers', paymentProviderRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 3000;
let server;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    logger.info('MySQL connection established successfully.');

    // sequelize.sync() creates tables automatically.
    // NOTE: No Sequelize migration files exist yet — sync is the only schema mechanism.
    // TODO: Generate migrations (npx sequelize-cli db:generate-models) and remove sync in production.
    // For now: run sync in development only. Production deployments must have existing tables.
    if (config.server.env !== 'production') {
      await sequelize.sync();
      logger.info('Database synchronized (development mode only).');
    } else {
      logger.info('Production mode: skipping sequelize.sync() — ensure tables exist via migrations.');
    }

    if (require.main === module) {
      server = app.listen(PORT, '0.0.0.0', () => {
        logger.info(`Server is running on port ${PORT}`);
      });
    }
  } catch (error) {
    logger.error('Unable to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown handler
const shutdown = async (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  const forceExit = setTimeout(() => {
    logger.error('Graceful shutdown timed out. Forcing exit.');
    process.exit(1);
  }, 15000);

  try {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
      logger.info('HTTP server closed.');
    }
    await sequelize.close();
    logger.info('MySQL connection closed.');
    await mongoose.connection.close();
    logger.info('MongoDB connection closed.');
  } catch (e) {
    logger.error('Error during shutdown:', e);
  } finally {
    clearTimeout(forceExit);
    process.exit(0);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

startServer();

module.exports = app;
 