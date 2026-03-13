const mongoose = require('mongoose');

const SchemeSchema = new mongoose.Schema({
    name: {
        type: String,
        enum: ['Government Scholarship', 'Minority Scholarship', 'Sports Quota', 'Merit Scholarship'],
        unique: true,
        required: true
    },
    studentsApplied: { type: Number, default: 0 },
    studentsApproved: { type: Number, default: 0 },
    totalEligibleStudents: { type: Number, default: 100 } // Default pool; can be updated by admin
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual: Utilization Percentage
SchemeSchema.virtual('utilizationPercentage').get(function () {
    if (!this.totalEligibleStudents || this.totalEligibleStudents === 0) return 0;
    return parseFloat(((this.studentsApproved / this.totalEligibleStudents) * 100).toFixed(2));
});

module.exports = mongoose.model('Scheme', SchemeSchema);
