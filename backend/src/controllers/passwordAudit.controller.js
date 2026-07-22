const PasswordAudit = require('../models/passwordAudit.model');
const { logger } = require('../utils/logger');

/**
 * GET /api/admin/users/:userId/password-audit
 * Admin-only: view password change history for a user.
 * Returns metadata only — no passwords, no hashes.
 */
const getUserPasswordAudit = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId, 10);
        if (isNaN(userId)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        const records = await PasswordAudit.find(
            { user_id: userId },
            { _id: 0, user_id: 1, username: 1, change_type: 1, changed_by_id: 1, changed_by_username: 1, created_at: 1 }
        ).sort({ created_at: -1 }).limit(100).lean();

        return res.json({ success: true, audit: records });
    } catch (error) {
        logger.error('getUserPasswordAudit error:', error);
        res.status(500).json({ error: 'Error fetching audit records' });
    }
};

module.exports = { getUserPasswordAudit };
