const express = require('express');
const router = express.Router();
const { login, registerUser, changePassword, adminResetPassword } = require('../controllers/auth.controller');
const { auth, authorize } = require('../middleware/auth.middleware');

// Public routes
router.post('/login', login);

// Authenticated routes — available even when must_change_password = true
router.post('/change-password', auth, changePassword);

// Admin-only routes
router.post('/register/user', auth, authorize('admin'), registerUser);
router.post('/users/:userId/reset-password', auth, authorize('admin'), adminResetPassword);

module.exports = router; 