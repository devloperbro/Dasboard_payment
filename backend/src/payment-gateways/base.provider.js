/**
 * BaseProvider — abstract base class for all payment gateway adapters.
 *
 * Adapters MUST extend this class and implement each method.
 * All unimplemented methods return a standardised NOT_IMPLEMENTED error —
 * they do NOT throw, so callers can handle gracefully.
 */
class BaseProvider {
    /**
     * @param {string} name - machine name e.g. 'razorpay'
     * @param {string} displayName - human name e.g. 'Razorpay'
     */
    constructor(name, displayName) {
        if (new.target === BaseProvider) {
            throw new Error('BaseProvider is abstract — extend it.');
        }
        this.name = name;
        this.displayName = displayName;
    }

    /**
     * Whether this adapter is fully configured and ready to process payments.
     * Override in subclass — read required env vars / config.
     * @returns {boolean}
     */
    isConfigured() {
        return false;
    }

    /**
     * Create a payin order/session with the gateway.
     * @param {Object} paymentData
     * @returns {Promise<{success: false, error: string, code: string}>}
     */
    async createPayin(paymentData) {
        return this._notImplemented('createPayin');
    }

    /**
     * Get the status of a payin with the gateway.
     * @param {string} gatewayReference
     */
    async getPaymentStatus(gatewayReference) {
        return this._notImplemented('getPaymentStatus');
    }

    /**
     * Verify an incoming webhook signature.
     * Must be called with the RAW request body (before JSON parsing).
     * @param {Buffer|string} rawBody
     * @param {Object} headers
     * @returns {Promise<{valid: false, error: string}>}
     */
    async verifyWebhook(rawBody, headers) {
        return this._notImplemented('verifyWebhook');
    }

    /**
     * Normalize a verified webhook event to a standard internal format.
     * @param {Object} event - parsed webhook payload
     * @returns {Promise<Object>}
     */
    async normalizeWebhook(event) {
        return this._notImplemented('normalizeWebhook');
    }

    /**
     * Initiate a payout (if the provider supports it).
     * @param {Object} payoutData
     */
    async createPayout(payoutData) {
        return this._notImplemented('createPayout');
    }

    /**
     * Get payout status.
     * @param {string} gatewayReference
     */
    async getPayoutStatus(gatewayReference) {
        return this._notImplemented('getPayoutStatus');
    }

    _notImplemented(method) {
        return {
            success: false,
            code: 'NOT_IMPLEMENTED',
            provider: this.name,
            method,
            error: `${this.displayName} adapter: ${method}() is not yet implemented.`
        };
    }
}

module.exports = BaseProvider;
