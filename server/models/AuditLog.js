const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
    action: {
        type: String,
        required: true,
        enum: [
            'APPLICATION_SUBMITTED',
            'APPLICATION_APPROVED',
            'APPLICATION_REJECTED',
            'APPLICATION_DELETED',
            'AMOUNT_MODIFIED',
            'STATUS_UPDATED',
            'PASSWORD_CHANGED',
            'LOGIN_SUCCESS',
            'LOGIN_FAILURE'
        ]
    },
    applicationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Concession',
        required: false // Some actions might not be application-specific
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userRole: {
        type: String,
        enum: ['student', 'admin'],
        required: true
    },
    message: {
        type: String,
        required: true
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed, // Flexible object for additional data
        default: {}
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true // Index for fast sorting
    }
});

// Index for faster queries on userId and action type
AuditLogSchema.index({ userId: 1, timestamp: -1 });
AuditLogSchema.index({ action: 1, timestamp: -1 });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
