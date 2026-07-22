/**
 * mustChangePassword middleware
 *
 * Blocks access to all routes except /api/auth/change-password
 * when must_change_password = true.
 * Applied AFTER the auth middleware.
 */
const mustChangePassword = (req, res, next) => {
    if (!req.user) return next();

    // Allow the change-password endpoint itself
    if (req.path === '/change-password' || req.originalUrl.endsWith('/change-password')) {
        return next();
    }

    if (req.user.must_change_password) {
        return res.status(403).json({
            success: false,
            code: 'MUST_CHANGE_PASSWORD',
            message: 'You must change your password before accessing this resource.'
        });
    }

    next();
};

module.exports = mustChangePassword;
