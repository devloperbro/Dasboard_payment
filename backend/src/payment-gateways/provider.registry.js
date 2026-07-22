/**
 * ProviderRegistry — singleton registry of available payment adapters.
 *
 * Adapters are registered at startup. Adding a new provider requires
 * a code change + deployment — this is intentional.
 *
 * To add a new provider:
 * 1. Create backend/src/payment-gateways/providers/myprovider.provider.js
 * 2. Register it below with registry.register('myprovider', require('./providers/myprovider.provider'))
 * 3. Add 'myprovider' to PaymentProvider model ENUM
 * 4. Deploy
 */
const razorpayProvider = require('./providers/razorpay.provider');
const phonePeProvider  = require('./providers/phonepe.provider');

class ProviderRegistry {
    constructor() {
        this._adapters = new Map();
    }

    register(name, adapter) {
        this._adapters.set(name, adapter);
    }

    get(name) {
        return this._adapters.get(name) || null;
    }

    all() {
        return Array.from(this._adapters.entries()).map(([name, adapter]) => ({
            name,
            displayName: adapter.displayName,
            isConfigured: adapter.isConfigured()
        }));
    }
}

const registry = new ProviderRegistry();

// Register all known providers (stubs included)
registry.register('razorpay', razorpayProvider);
registry.register('phonepe',  phonePeProvider);

module.exports = registry;
