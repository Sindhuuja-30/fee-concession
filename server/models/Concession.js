const mongoose = require('mongoose');

const ConcessionSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    studentName: { type: String, required: true },
    documents: [{ type: String }], // Array of filenames (dummy)
    registerNo: { type: String, required: true },
    department: { type: String, required: true },
    year: { type: String, required: true },
    income: { type: String, required: true },
    occupation: { type: String, required: true },
    parentName: { type: String, required: true },
    residentialArea: { type: String, enum: ['Rural', 'Urban'], required: true },
    semesterFee: { type: Number, required: true },
    prevSemResult: { type: String, enum: ['Pass', 'Backlog'], required: true },
    scholarship: { type: String, enum: ['Yes', 'No'], required: true },
    course: { type: String, default: '' },
    institution: { type: String, default: '' },
    email: { type: String, default: '' },
    mobile: { type: String, default: '' },
    dependents: { type: Number, required: true },
    category: { type: String, required: true },
    reason: { type: String, required: true },
    amount: { type: Number, required: true },
    concessionType: { type: String, enum: ['Full', 'Partial'], required: true },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Concession', ConcessionSchema);
