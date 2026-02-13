const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Plain text for simplicity as requested
    role: { type: String, enum: ['student', 'admin'], default: 'student' },

    // Profile Details (Persisted)
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
    course: { type: String, default: '' },
    institution: { type: String, default: '' },
    mobile: { type: String, default: '' },
    dependents: { type: Number, default: 0 },
    category: { type: String, default: '' },

    // Documents Metadata (stored filenames)
    documents: {
        incomeCert: { type: String, default: '' },
        bonafideCert: { type: String, default: '' },
        feeReceipt: { type: String, default: '' },
        otherDoc: { type: String, default: '' }
    }
});

module.exports = mongoose.model('User', UserSchema);
