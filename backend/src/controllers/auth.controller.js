const jwt = require('jsonwebtoken');
const { User, UserStatus, MerchantDetails } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const PasswordAudit = require('../models/passwordAudit.model');
const { logger } = require('../utils/logger');

const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, user_type: user.user_type },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
};

const login = async (req, res) => {
    try {
        const { user_name, password } = req.body;

        const user = await User.findOne({
            where: { user_name },
            include: [
                { model: UserStatus },
                { model: MerchantDetails }
            ]
        });

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isValidPassword = await user.validatePassword(password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = generateToken(user);

        return res.json({
            user: {
                id: user.id,
                name: user.name,
                user_name: user.user_name,
                email: user.email,
                user_type: user.user_type,
                must_change_password: user.must_change_password,
                status: user.UserStatus,
                merchant_details: user.MerchantDetails
            },
            token,
            // Signal to frontend to redirect to change-password page
            must_change_password: user.must_change_password
        });
    } catch (error) {
        logger.error('Login error:', error);
        res.status(500).json({ error: 'Error logging in' });
    }
};

const registerUser = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            name, user_name, password, email, mobile,
            company_name, business_type, user_type,
            gst_no, pan_card, aadhar_card, address, city, state, pin_code
        } = req.body;

        // Prevent assigning main admin role via API
        if (user_type === 'admin' && req.user?.user_type !== 'admin') {
            return res.status(403).json({ error: 'Cannot assign admin role' });
        }

        const existingUser = await User.findOne({
            where: { [Op.or]: [{ user_name }, { email }] }
        });

        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const agent_id = req.user?.user_type === 'agent' ? req.user.id : null;

        const user = await User.create({
            name, user_name, password, email, mobile,
            company_name, business_type, user_type,
            gst_no, pancard: pan_card, aadhaar_card: aadhar_card,
            address, city, state, pincode: pin_code,
            agent_id,
            created_by: req.user?.id || null,
            must_change_password: true   // All new users must change password on first login
        });

        await UserStatus.create({ user_id: user.id });

        return res.status(201).json({
            user: {
                id: user.id,
                name: user.name,
                user_name: user.user_name,
                email: user.email,
                user_type: user.user_type,
                must_change_password: true
            },
            // Plaintext password returned ONLY at creation time so admin can relay to user
            // It is NOT stored or logged anywhere else
            temporary_password: password,
            message: 'User created. They must change their password on first login.'
        });
    } catch (error) {
        logger.error('Registration error:', error);
        res.status(500).json({ error: 'Error creating user' });
    }
};

/**
 * Change own password (authenticated user).
 * Records SELF_CHANGE audit entry.
 */
const changePassword = async (req, res) => {
    try {
        const { current_password, new_password } = req.body;

        if (!current_password || !new_password) {
            return res.status(400).json({ error: 'current_password and new_password are required' });
        }
        if (new_password.length < 8) {
            return res.status(400).json({ error: 'new_password must be at least 8 characters' });
        }

        const user = await User.findByPk(req.user.id);
        const valid = await user.validatePassword(current_password);
        if (!valid) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        user.password = new_password;           // hashed by beforeUpdate hook
        user.must_change_password = false;
        await user.save();

        // Audit — no passwords stored
        await PasswordAudit.create({
            user_id: user.id,
            username: user.user_name,
            change_type: 'SELF_CHANGE',
            changed_by_id: user.id,
            changed_by_username: user.user_name
        });

        logger.info('Password changed (SELF_CHANGE)', { userId: user.id });
        return res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        logger.error('changePassword error:', error);
        res.status(500).json({ error: 'Error changing password' });
    }
};

/**
 * Admin resets a user's password.
 * Records ADMIN_RESET audit entry.
 * Only callable by admin role.
 */
const adminResetPassword = async (req, res) => {
    try {
        const { userId } = req.params;
        const { new_password } = req.body;

        if (!new_password || new_password.length < 8) {
            return res.status(400).json({ error: 'new_password must be at least 8 characters' });
        }

        const target = await User.findByPk(userId);
        if (!target) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Prevent resetting main admin's password unless caller IS the main admin
        if (target.is_main_admin && !req.user.is_main_admin) {
            return res.status(403).json({ error: 'Cannot reset main admin password' });
        }

        target.password = new_password;          // hashed by hook
        target.must_change_password = true;      // user must set their own on next login
        await target.save();

        // Audit — no passwords stored
        await PasswordAudit.create({
            user_id: target.id,
            username: target.user_name,
            change_type: 'ADMIN_RESET',
            changed_by_id: req.user.id,
            changed_by_username: req.user.user_name
        });

        logger.info('Password reset (ADMIN_RESET)', { targetId: target.id, adminId: req.user.id });
        return res.json({
            success: true,
            message: 'Password reset. User must change it on next login.',
            // temporary_password is returned ONCE so admin can relay it to the user
            // out-of-band (e.g. secure chat). It is NOT logged and NOT stored in the DB.
            // The user is forced to change it on first login (must_change_password=true).
            temporary_password: new_password
        });
    } catch (error) {
        logger.error('adminResetPassword error:', error);
        res.status(500).json({ error: 'Error resetting password' });
    }
};

module.exports = { login, registerUser, changePassword, adminResetPassword };
