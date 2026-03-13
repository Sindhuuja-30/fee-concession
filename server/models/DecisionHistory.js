const mongoose = require('mongoose');

const DecisionHistorySchema = new mongoose.Schema({
    studentName: {
        type: String,
        required: true
    },
    registerNo: {
        type: String,
        required: true
    },
    schemeType: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    decision: {
        type: String,
        enum: ['Approved', 'Rejected'],
        required: true
    },
    adminName: {
        type: String,
        required: true
    },
    adminRole: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('DecisionHistory', DecisionHistorySchema);
