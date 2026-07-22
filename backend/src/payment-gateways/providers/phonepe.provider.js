/**
 * PhonePe Provider Stub
 *
 * Adapter is NOT implemented yet.
 * All methods return NOT_IMPLEMENTED.
 *
 * When integrating PhonePe:
 * 1. Obtain PhonePe merchant credentials
 * 2. Set env vars: PHONEPE_MERCHANT_ID, PHONEPE_SALT_KEY, PHONEPE_SALT_INDEX, PHONEPE_WEBHOOK_SECRET
 * 3. Override createPayin(), verifyWebhook(), normalizeWebhook() etc.
 * 4. Set isConfigured() to check env vars are present.
 */
const BaseProvider = require('../base.provider');

class PhonePeProvider extends BaseProvider {
    constructor() {
        super('phonepe', 'PhonePe');
    }

    isConfigured() {
        return false;
    }
}

module.exports = new PhonePeProvider();
