require('dotenv').config();

const isProd = process.env.NODE_ENV === 'production';

// Fail fast in production if critical secrets are missing
if (isProd && !process.env.JWT_SECRET) {
    throw new Error('FATAL: JWT_SECRET environment variable must be set in production');
}

module.exports = {
    server: {
        port: process.env.PORT || 3000,
        env: process.env.NODE_ENV || 'development'
    },
    database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT, 10) || 3306,
        // Accept both docker-compose style (DB_NAME/DB_USER/DB_PASS)
        // and legacy style (DB_DATABASE/DB_USERNAME/DB_PASSWORD)
        name: process.env.DB_DATABASE || process.env.DB_NAME || 'techturect',
        username: process.env.DB_USERNAME || process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || process.env.DB_PASS || ''
    },
    mongodb: {
        // Accept both MONGODB_URI and MONGO_URI
        uri: process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/techturect'
    },
    jwt: {
        // No insecure fallback — will throw above in production if missing
        secret: process.env.JWT_SECRET || 'dev-only-insecure-secret-do-not-use-in-prod',
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    },
    // redis-payment: durable Bull queue Redis (AOF, no eviction)
    redis: {
        host: process.env.REDIS_PAYMENT_HOST || process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PAYMENT_PORT || process.env.REDIS_PORT, 10) || 6380,
        password: process.env.REDIS_PAYMENT_PASSWORD || process.env.REDIS_PASSWORD || undefined
    },
    // redis-cache: disposable rate-limit / session cache (LRU ok)
    redisCache: {
        host: process.env.REDIS_CACHE_HOST || process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_CACHE_PORT || process.env.REDIS_PORT, 10) || 6379,
        password: process.env.REDIS_CACHE_PASSWORD || process.env.REDIS_PASSWORD || undefined
    },
    logging: {
        level: process.env.LOG_LEVEL || 'info'
    }
}; 