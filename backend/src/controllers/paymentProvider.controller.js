const { PaymentProvider } = require('../models');
const registry = require('../payment-gateways/provider.registry');
const { canActivateProvider } = require('../payment-gateways/provider.service');
const { logger } = require('../utils/logger');

/**
 * GET /api/admin/payment-providers
 * List all payment providers with their status.
 * Secrets are NEVER returned.
 */
const listProviders = async (req, res) => {
    try {
        const dbProviders = await PaymentProvider.findAll({
            attributes: { exclude: [] }
        });

        // Merge DB config with adapter status
        const result = dbProviders.map(p => ({
            id: p.id,
            name: p.name,
            display_name: p.display_name,
            enabled: p.enabled,
            mode: p.mode,
            payin_enabled: p.payin_enabled,
            payout_enabled: p.payout_enabled,
            is_active: p.is_active,
            adapter_status: (() => {
                const adapter = registry.get(p.name);
                if (!adapter) return 'NOT_REGISTERED';
                if (!adapter.isConfigured()) return 'NOT_CONFIGURED';
                return 'CONFIGURED';
            })(),
            updated_at: p.updated_at
        }));

        return res.json({ success: true, providers: result });
    } catch (error) {
        logger.error('listProviders error:', error);
        res.status(500).json({ error: 'Error fetching providers' });
    }
};

/**
 * PUT /api/admin/payment-providers/:name
 * Update provider metadata (mode, display_name, payin_enabled, payout_enabled).
 * Does NOT store API secrets — those come from environment variables.
 * Activation requires adapter to be configured.
 */
const updateProvider = async (req, res) => {
    try {
        const { name } = req.params;
        const { display_name, mode, payin_enabled, payout_enabled } = req.body;

        const provider = await PaymentProvider.findOne({ where: { name } });
        if (!provider) {
            return res.status(404).json({ error: `Provider '${name}' not found` });
        }

        // Only main admin can modify provider settings
        if (!req.user.is_main_admin) {
            return res.status(403).json({ error: 'Only the main admin can modify payment provider settings' });
        }

        if (display_name !== undefined) provider.display_name = display_name;
        if (mode !== undefined) provider.mode = mode;
        if (payin_enabled !== undefined) provider.payin_enabled = payin_enabled;
        if (payout_enabled !== undefined) provider.payout_enabled = payout_enabled;
        provider.created_by = req.user.id;

        await provider.save();
        logger.info('Provider updated', { name, by: req.user.id });

        return res.json({ success: true, message: `Provider '${name}' updated`, provider: {
            name: provider.name,
            display_name: provider.display_name,
            mode: provider.mode,
            payin_enabled: provider.payin_enabled,
            payout_enabled: provider.payout_enabled,
            is_active: provider.is_active
        }});
    } catch (error) {
        logger.error('updateProvider error:', error);
        res.status(500).json({ error: 'Error updating provider' });
    }
};

/**
 * POST /api/admin/payment-providers/:name/activate
 * Set a provider as active. Rejects if adapter is not configured/implemented.
 * Deactivates any previously active provider.
 */
const activateProvider = async (req, res) => {
    try {
        const { name } = req.params;

        if (!req.user.is_main_admin) {
            return res.status(403).json({ error: 'Only the main admin can activate payment providers' });
        }

        const { canActivate, reason } = canActivateProvider(name);
        if (!canActivate) {
            return res.status(422).json({
                success: false,
                code: 'PROVIDER_NOT_READY',
                message: reason
            });
        }

        const provider = await PaymentProvider.findOne({ where: { name } });
        if (!provider) {
            return res.status(404).json({ error: `Provider '${name}' not found` });
        }

        // Deactivate any current active provider first
        await PaymentProvider.update({ is_active: false }, { where: { is_active: true } });

        provider.is_active = true;
        provider.enabled = true;
        await provider.save();

        logger.info('Provider activated', { name, by: req.user.id });
        return res.json({ success: true, message: `Provider '${name}' is now active` });
    } catch (error) {
        logger.error('activateProvider error:', error);
        res.status(500).json({ error: 'Error activating provider' });
    }
};

/**
 * POST /api/admin/payment-providers/:name/deactivate
 * Deactivates a provider. Platform enters PAYMENT_PROVIDER_NOT_CONFIGURED state.
 */
const deactivateProvider = async (req, res) => {
    try {
        const { name } = req.params;

        if (!req.user.is_main_admin) {
            return res.status(403).json({ error: 'Only the main admin can deactivate payment providers' });
        }

        await PaymentProvider.update({ is_active: false, enabled: false }, { where: { name } });

        logger.info('Provider deactivated', { name, by: req.user.id });
        return res.json({ success: true, message: `Provider '${name}' deactivated. Payment endpoints will return PAYMENT_PROVIDER_NOT_CONFIGURED.` });
    } catch (error) {
        logger.error('deactivateProvider error:', error);
        res.status(500).json({ error: 'Error deactivating provider' });
    }
};

module.exports = { listProviders, updateProvider, activateProvider, deactivateProvider };
