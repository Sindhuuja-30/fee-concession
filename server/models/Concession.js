const mongoose = require('mongoose');

const ConcessionSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    studentName: { type: String, required: true },
    documents: [{ type: String }], // Array of filenames (legacy compatibility)
    registerNo: { type: String, default: '' },
    department: { type: String, default: '' },
    year: { type: String, default: '' },
    income: { type: String, default: '' },
    occupation: { type: String, default: '' },
    parentName: { type: String, default: '' },
    residentialArea: { type: String, default: '' },
    semesterFee: { type: Number, default: 0 },
    prevSemResult: { type: String, default: '' },
    scholarship: { type: String, default: '' },

    // Academic Performance Fields
    cgpa: { type: Number, default: 0, min: 0, max: 10 },
    semester: { type: String, default: '' },
    academicYear: { type: String, default: '' },

    // Explicit Document Fields
    incomeCert: { type: String, default: '' },
    bonafideCert: { type: String, default: '' },
    feeReceipt: { type: String, default: '' },
    marksheet: { type: String, default: '' },    // No longer globally required — scheme-specific
    religionProof: { type: String, default: '' }, // For Minority Scholarship
    otherDoc: { type: String, default: '' },

    course: { type: String, default: '' },
    institution: { type: String, default: '' },
    email: { type: String, default: '' },
    mobile: { type: String, default: '' },
    dependents: { type: Number, default: 0 },
    category: { type: String, default: '' },
    parentContact: { type: String, default: '' },
    hostelStatus: { type: String, enum: ['Hosteller', 'Day Scholar', ''], default: '' },
    reason: { type: String, default: '' },
    amount: { type: Number, default: 0 },
    concessionType: { type: String, enum: ['Full', 'Partial', ''], default: '' },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    date: { type: Date, default: Date.now },

    // ── Scheme-Based Fields ──────────────────────────────────────────────────
    scheme: {
        type: String,
        enum: ['Government Scholarship', 'Minority Scholarship', 'Sports Quota', 'Merit Scholarship', ''],
        default: ''
    },
    religion: { type: String, default: '' },          // For Minority Scholarship
    marksPercentage: { type: Number, default: null },  // For Merit / Minority Scholarship

    // Sports Quota certificate details
    sportsCertificates: [{
        level: {
            type: String,
            enum: ['Zone', 'District', 'State', 'National', 'International'],
            required: true
        },
        filename: { type: String, default: '' }
    }],

    sportsPoints: { type: Number, default: 0 },          // Sum of all sports certificate points
    concessionPercentage: { type: Number, default: 0 },  // Auto-calculated from scheme rules
    schemeEligible: { type: Boolean, default: null },     // Whether student passed scheme eligibility
    schemeReason: { type: String, default: '' },          // Explanation of eligibility result

    // ── Income-Based Point System ─────────────────────────────────────────────
    familyIncomeAmount: { type: Number, default: 0 },
    incomePoints: { type: Number, default: 0 },
    adminRecommendation: { type: String, default: '' },
    // ────────────────────────────────────────────────────────────────────────
    // ────────────────────────────────────────────────────────────────────────

    // Eligibility Scoring System (legacy)
    eligibilityScore: { type: Number, default: 0, min: 0, max: 100 },
    recommendedConcessionRate: { type: Number, default: 0 },
    finalApprovedRate: { type: Number, default: null },
    rejectionReason: { type: String, default: null },

    // Special Conditions (Single Parent, Orphan, etc.)
    specialConditions: [{ type: String }],

    priorityLevel: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },

    // Approval metadata for post-approval letters
    approvedBy: { type: String, default: '' },
    approvalDate: { type: Date, default: null },

    // Status history for timeline display
    statusHistory: [{
        status: { type: String },
        date: { type: Date, default: Date.now },
        note: { type: String, default: '' }
    }]
});

module.exports = mongoose.model('Concession', ConcessionSchema);
