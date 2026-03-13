const AuditLog = require('../models/AuditLog');

/**
 * Log an action to the audit trail
 * @param {string} action - Type of action (enum from AuditLog schema)
 * @param {string} userId - ID of user performing the action
 * @param {string} userRole - Role of user (student/admin)
 * @param {string} applicationId - ID of related application (optional)
 * @param {string} message - Human-readable description
 * @param {Object} metadata - Additional data (optional)
 */
async function logAction(action, userId, userRole, applicationId = null, message, metadata = {}) {
    try {
        const auditLog = new AuditLog({
            action,
            userId,
            userRole,
            applicationId,
            message,
            metadata
        });

        await auditLog.save();
        console.log(`[AUDIT] ${action}: ${message}`);
    } catch (error) {
        // Non-blocking: log error but don't crash the app
        console.error('[AUDIT ERROR] Failed to log action:', error.message);
    }
}

module.exports = { logAction };
