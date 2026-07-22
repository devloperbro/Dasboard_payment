/**
 * PasswordAudit — MongoDB model
 *
 * Stores METADATA about password change events only.
 * NEVER stores: plaintext password, old/new password hash, or any secret.
 */
const mongoose = require('mongoose');

const passwordAuditSchema = new mongoose.Schema({
    user_id: {
        type: Number,
        required: true,
        index: true
    },
    username: {
        type: String,
        required: true
    },
    change_type: {
        type: String,
        enum: ['SELF_CHANGE', 'ADMIN_RESET'],
        required: true
    },
    changed_by_id: {
        type: Number,
        required: true
    },
    changed_by_username: {
        type: String,
        required: true
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: false },
    collection: 'password_audits'
});

passwordAuditSchema.index({ user_id: 1, created_at: -1 });

const PasswordAudit = mongoose.model('PasswordAudit', passwordAuditSchema);
module.exports = PasswordAudit;
