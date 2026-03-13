const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function testLoginFix() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/fee_concession_db');
        console.log('MongoDB Connected');

        const testEmail = '  Test.Fix@College.Edu  ';
        const normalizedEmail = 'test.fix@college.edu';
        const testPassword = 'Password123!';

        // 1. Cleanup old test user
        await User.deleteOne({ email: normalizedEmail });

        // 2. Test Registration (Middleware should normalize)
        console.log('Submitting registration with:', testEmail);
        const newUser = new User({
            name: 'Test Fix User',
            email: testEmail,
            password: testPassword,
            role: 'student'
        });
        await newUser.save();

        const storedUser = await User.findOne({ email: normalizedEmail });
        if (storedUser && storedUser.email === normalizedEmail) {
            console.log('✅ Registration normalization SUCCESS');
        } else {
            console.error('❌ Registration normalization FAILED. Stored email:', storedUser ? storedUser.email : 'NOT FOUND');
        }

        // 3. Test Querying (Manual check of what normally happens in login)
        const loginAttemptEmail = 'TEST.FIX@COLLEGE.EDU';
        const foundUser = await User.findOne({ email: loginAttemptEmail.trim().toLowerCase() });
        if (foundUser) {
            console.log('✅ Login query normalization SUCCESS');
        } else {
            console.error('❌ Login query normalization FAILED');
        }

        // Cleanup
        await User.deleteOne({ email: normalizedEmail });
        console.log('Cleanup done.');

        process.exit(0);
    } catch (err) {
        console.error('Test failed:', err);
        process.exit(1);
    }
}

testLoginFix();
