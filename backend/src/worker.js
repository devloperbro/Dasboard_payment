/**
 * Standalone Worker Entry Point
 *
 * Run this instead of app.js when the payment worker should operate
 * as a separate process or Docker container.
 *
 * Usage:
 *   node src/worker.js
 *   npm run start:worker
 *
 * In docker-compose, set SEPARATE_WORKER=true on the API service
 * so it does NOT also start the worker inline.
 */
require('dotenv').config();
require('./workers/payment.worker');
