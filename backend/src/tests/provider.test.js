/**
 * Payment provider registry + service tests
 * Node.js built-in test runner — no DB required
 */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const registry = require('../payment-gateways/provider.registry');
const BaseProvider = require('../payment-gateways/base.provider');
const { canActivateProvider } = require('../payment-gateways/provider.service');

describe('Provider registry', () => {
    test('registry has razorpay adapter', () => {
        const adapter = registry.get('razorpay');
        assert.ok(adapter, 'razorpay should be registered');
    });

    test('registry has phonepe adapter', () => {
        const adapter = registry.get('phonepe');
        assert.ok(adapter, 'phonepe should be registered');
    });

    test('adapter for unknown provider is falsy (null or undefined)', () => {
        const adapter = registry.get('stripe');
        assert.ok(!adapter, 'unknown provider should return falsy');
    });
});

describe('BaseProvider NOT_IMPLEMENTED stubs', () => {
    test('razorpay createPayin returns NOT_IMPLEMENTED', async () => {
        const adapter = registry.get('razorpay');
        const result = await adapter.createPayin({});
        assert.equal(result.success, false);
        assert.equal(result.code, 'NOT_IMPLEMENTED');
    });

    test('phonepe createPayout returns NOT_IMPLEMENTED', async () => {
        const adapter = registry.get('phonepe');
        const result = await adapter.createPayout({});
        assert.equal(result.success, false);
        assert.equal(result.code, 'NOT_IMPLEMENTED');
    });

    test('razorpay isConfigured returns false (no env keys set in test)', () => {
        const adapter = registry.get('razorpay');
        assert.equal(adapter.isConfigured(), false);
    });

    test('phonepe isConfigured returns false (no env keys set in test)', () => {
        const adapter = registry.get('phonepe');
        assert.equal(adapter.isConfigured(), false);
    });
});

describe('canActivateProvider', () => {
    test('razorpay cannot be activated — not configured', () => {
        const { canActivate, reason } = canActivateProvider('razorpay');
        assert.equal(canActivate, false);
        assert.ok(reason && reason.length > 0, 'should provide a reason');
    });

    test('phonepe cannot be activated — not configured', () => {
        const { canActivate, reason } = canActivateProvider('phonepe');
        assert.equal(canActivate, false);
        assert.ok(reason);
    });

    test('unknown provider cannot be activated', () => {
        const { canActivate, reason } = canActivateProvider('unknown_gateway');
        assert.equal(canActivate, false);
        assert.ok(reason);
    });
});

describe('PAYMENT_PROVIDER_NOT_CONFIGURED response shape', () => {
    test('paymentProviderNotConfiguredResponse returns correct shape', () => {
        const { paymentProviderNotConfiguredResponse } = require('../payment-gateways/provider.service');
        let sentBody = null;
        let sentStatus = null;

        const res = {
            status: (code) => { sentStatus = code; return res; },
            json: (body) => { sentBody = body; }
        };

        paymentProviderNotConfiguredResponse(res);

        assert.equal(sentStatus, 503);
        assert.equal(sentBody.success, false);
        assert.equal(sentBody.code, 'PAYMENT_PROVIDER_NOT_CONFIGURED');
        assert.ok(sentBody.message);
    });
});
