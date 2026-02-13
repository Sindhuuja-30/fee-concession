const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // User receiving the notification
    message: { type: String, required: true }, // Notification text
    type: { type: String, enum: ['info', 'success', 'error', 'warning'], default: 'info' }, // Style type
    isRead: { type: Boolean, default: false }, // Read status
    relatedId: { type: mongoose.Schema.Types.ObjectId, ref: 'Concession' }, // Link to Application (optional)
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', NotificationSchema);
