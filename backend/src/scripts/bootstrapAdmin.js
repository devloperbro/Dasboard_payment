/**
 * Bootstrap Admin Script — idempotent
 *
 * Creates the MAIN ADMIN user if one does not already exist.
 * Safe to run multiple times — will NOT overwrite an existing main admin.
 *
 * Usage:
 *   npm run bootstrap:admin
 *
 * Required environment variables (set in .env or server environment):
 *   ADMIN_EMAIL     - admin email address
 *   ADMIN_USERNAME  - admin login username
 *   ADMIN_NAME      - admin display name
 *   ADMIN_PASSWORD  - temporary password (admin must change after first login)
 *
 * On the server (production):
 *   cd /opt/payment-app/backend
 *   ADMIN_EMAIL=client@buddypay.com \
 *   ADMIN_USERNAME=admin \
 *   ADMIN_NAME="BuddyPay Admin" \
 *   ADMIN_PASSWORD=<secure-temp-password> \
 *   node src/scripts/bootstrapAdmin.js
 */

require('dotenv').config();
const { sequelize, User, UserStatus } = require('../models');
const { logger } = require('../utils/logger');

async function bootstrapAdmin() {
    const email    = process.env.ADMIN_EMAIL;
    const username = process.env.ADMIN_USERNAME;
    const name     = process.env.ADMIN_NAME;
    const password = process.env.ADMIN_PASSWORD;

    // Validate required inputs
    const missing = ['ADMIN_EMAIL', 'ADMIN_USERNAME', 'ADMIN_NAME', 'ADMIN_PASSWORD']
        .filter(k => !process.env[k]);

    if (missing.length > 0) {
        logger.error('bootstrap:admin — missing required environment variables', { missing });
        console.error(`\nERROR: Missing required environment variables: ${missing.join(', ')}`);
        console.error('Set them in .env or pass them directly before the command.\n');
        process.exit(1);
    }

    if (password.length < 8) {
        console.error('\nERROR: ADMIN_PASSWORD must be at least 8 characters.\n');
        process.exit(1);
    }

    try {
        await sequelize.authenticate();

        // Idempotency check — do NOT overwrite existing main admin
        const existing = await User.findOne({ where: { is_main_admin: true } });

        if (existing) {
            console.log(`\n✓ Main admin already exists (username: ${existing.user_name}, email: ${existing.email}).\n`);
            console.log('  Bootstrap is idempotent — no changes made.\n');
            await sequelize.close();
            return;
        }

        // Also check if email/username conflicts with any existing user
        const conflict = await User.findOne({
            where: {
                [require('sequelize').Op.or]: [{ email }, { user_name: username }]
            }
        });

        if (conflict) {
            console.error(`\nERROR: A user with email '${email}' or username '${username}' already exists (id: ${conflict.id}).`);
            console.error('  If this is the intended admin, run a separate migration or DB script to set is_main_admin=true.\n');
            await sequelize.close();
            process.exit(1);
        }

        // Create the main admin
        // Password is hashed by the User model beforeCreate hook
        const admin = await User.create({
            name,
            user_name: username,
            email,
            password,
            user_type: 'admin',
            is_main_admin: true,
            must_change_password: true,    // admin must set their own password on first login
            password_changed_at: null
        });

        await UserStatus.create({ user_id: admin.id });

        logger.info('bootstrap:admin — main admin created', {
            id: admin.id,
            user_name: admin.user_name,
            email: admin.email
        });

        console.log('\n✓ Main admin created successfully.');
        console.log(`  ID:       ${admin.id}`);
        console.log(`  Username: ${admin.user_name}`);
        console.log(`  Email:    ${admin.email}`);
        console.log(`  Status:   must_change_password = true`);
        console.log('\n  The admin must change their password on first login.\n');

        await sequelize.close();
    } catch (error) {
        logger.error('bootstrap:admin failed', { error: error.message });
        console.error('\nERROR:', error.message, '\n');
        process.exit(1);
    }
}

bootstrapAdmin();
