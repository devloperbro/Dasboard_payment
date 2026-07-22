/**
 * Razorpay Provider Stub
 *
 * Adapter is NOT implemented yet.
 * All methods return NOT_IMPLEMENTED.
 *
 * When integrating Razorpay:
 * 1. npm install razorpay (backend/package.json)
 * 2. Set env vars: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET
 * 3. Override createPayin(), verifyWebhook(), normalizeWebhook() etc.
 * 4. Set isConfigured() to check env vars are present.
 */
const BaseProvider = require('../base.provider');

class RazorpayProvider extends BaseProvider {
    constructor() {
        super('razorpay', 'Razorpay');
    }

    isConfigured() {
        // Will be true when env vars are set AND adapter is implemented
        return false;
    }

    // All methods use BaseProvider default (NOT_IMPLEMENTED responses)
}

module.exports = new RazorpayProvider();
