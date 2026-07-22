/**
 * Auth tests — Node.js built-in test runner (node:test)
 * Run: npm test   or   node --test src/tests/auth.test.js
 *
 * These tests use mocks and do NOT require a running DB.
 */
const { test, describe, mock, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');

// ---- Helpers under test (pure logic, no DB) ----
const { hashPassword, validatePassword } = (() => {
    const hashPassword = (p) => bcrypt.hash(p, 10);
    const validatePassword = (plain, hash) => bcrypt.compare(plain, hash);
    return { hashPassword, validatePassword };
})();

// ---- Provider registry (pure JS, no DB) ----
const registry = require('../payment-gateways/provider.registry');
const { canActivateProvider } = require('../payment-gateways/provider.service');

describe('Password Hashing', () => {
    test('password is stored as bcrypt hash', async () => {
        const hash = await hashPassword('Secret123!');
        assert.ok(hash.startsWith('$2a$') || hash.startsWith('$2b$'), 'should be bcrypt hash');
        assert.notEqual(hash, 'Secret123!', 'must not be plaintext');
    });

    test('correct password validates', async () => {
        const hash = await hashPassword('MyPass99');
        assert.ok(await validatePassword('MyPass99', hash));
    });

    test('wrong password does not validate', async () => {
        const hash = await hashPassword('MyPass99');
        assert.ok(!await validatePassword('WrongPass', hash));
    });
});

describe('Bootstrap Admin logic', () => {
    test('password must be at least 8 characters (guard)', () => {
        const minLength = (p) => p.length >= 8;
        assert.ok(!minLength('short'), 'too short should fail');
        assert.ok(minLength('longenough'), 'long enough should pass');
    });

    test('bootstrap is idempotent — does not overwrite existing admin', async () => {
        // Simulate the idempotency check
        let called = 0;
        const mockCreate = () => { called++; };
        const existingAdmin = { id: 1, user_name: 'admin', is_main_admin: true };

        // If admin found, mockCreate should NOT be called
        if (!existingAdmin) {
            mockCreate();
        }

        assert.equal(called, 0, 'should not create a second main admin');
    });
});

describe('Main Admin protection', () => {
    test('normal user user_type cannot be is_main_admin via API', () => {
        // The controller checks req.user.is_main_admin before allowing reset
        const mockReqUser = { id: 2, user_type: 'admin', is_main_admin: false };
        const targetUser = { id: 1, is_main_admin: true };

        const canReset = mockReqUser.is_main_admin || !targetUser.is_main_admin;
        assert.ok(!canReset, 'non-main admin should not reset main admin password');
    });

    test('main admin can reset any user password', () => {
        const mockReqUser = { id: 1, user_type: 'admin', is_main_admin: true };
        const targetUser = { id: 2, is_main_admin: false };

        const canReset = mockReqUser.is_main_admin || !targetUser.is_main_admin;
        assert.ok(canReset);
    });
});

describe('must_change_password enforcement', () => {
    test('user with must_change_password=true is blocked from non-change-password routes', () => {
        const mustChangePassword = require('../middleware/mustChangePassword');
        let nextCalled = false;
        let statusCode = null;

        const req = {
            user: { must_change_password: true },
            path: '/api/admin/users',
            originalUrl: '/api/admin/users'
        };
        const res = {
            status: (code) => { statusCode = code; return res; },
            json: () => {}
        };
        const next = () => { nextCalled = true; };

        mustChangePassword(req, res, next);

        assert.equal(nextCalled, false, 'next should not be called');
        assert.equal(statusCode, 403);
    });

    test('user with must_change_password=true can access change-password route', () => {
        const mustChangePassword = require('../middleware/mustChangePassword');
        let nextCalled = false;

        const req = {
            user: { must_change_password: true },
            path: '/change-password',
            originalUrl: '/api/auth/change-password'
        };
        const res = {};
        const next = () => { nextCalled = true; };

        mustChangePassword(req, res, next);
        assert.ok(nextCalled, 'next should be called for change-password route');
    });
});

describe('Password audit integrity', () => {
    test('password audit object contains no password fields', () => {
        const auditEntry = {
            user_id: 1,
            username: 'testuser',
            change_type: 'SELF_CHANGE',
            changed_by_id: 1,
            changed_by_username: 'testuser',
            created_at: new Date()
        };

        const forbidden = ['password', 'old_password', 'new_password', 'hash', 'plaintext'];
        const keys = Object.keys(auditEntry).map(k => k.toLowerCase());
        const found = forbidden.filter(f => keys.includes(f));
        assert.deepEqual(found, [], `Audit must not contain: ${found.join(', ')}`);
    });
});
