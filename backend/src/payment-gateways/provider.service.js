/**
 * ProviderService — selects and validates the active payment provider.
 *
 * Provider switching is DB-driven (no redeployment needed for switching
 * between already-implemented adapters).
 *
 * Adding a NEW adapter always requires a code change + deployment.
 */
const registry = require('./provider.registry');
const { logger } = require('../utils/logger');

/**
 * Get the active payin provider adapter from the DB configuration.
 *
 * @param {Object} PaymentProvider - Sequelize model
 * @returns {Promise<{adapter, config} | null>}
 */
async function getActivePayinProvider(PaymentProvider) {
    const active = await PaymentProvider.findOne({
        where: { is_active: true, payin_enabled: true }
    });

    if (!active) {
        return null;
    }

    const adapter = registry.get(active.name);
    if (!adapter) {
        logger.error('[provider] Active provider in DB has no registered adapter', { name: active.name });
        return null;
    }

    if (!adapter.isConfigured()) {
        logger.warn('[provider] Active provider adapter not configured', { name: active.name });
        return null;
    }

    return { adapter, config: active };
}

/**
 * Check whether a given provider is safe to activate.
 * A provider can only be activated if its adapter is registered AND configured.
 *
 * @param {string} providerName
 * @returns {{ canActivate: boolean, reason?: string }}
 */
function canActivateProvider(providerName) {
    const adapter = registry.get(providerName);

    if (!adapter) {
        return { canActivate: false, reason: `Provider '${providerName}' is not registered. Requires code + deployment.` };
    }

    if (!adapter.isConfigured()) {
        return { canActivate: false, reason: `Provider '${providerName}' adapter is NOT_CONFIGURED. Set required environment variables first.` };
    }

    return { canActivate: true };
}

/**
 * Controlled error response when no provider is available.
 * Used in payment endpoints.
 */
function paymentProviderNotConfiguredResponse(res) {
    return res.status(503).json({
        success: false,
        code: 'PAYMENT_PROVIDER_NOT_CONFIGURED',
        message: 'No payment provider is currently active. Contact the administrator.'
    });
}

module.exports = {
    getActivePayinProvider,
    canActivateProvider,
    paymentProviderNotConfiguredResponse
};
