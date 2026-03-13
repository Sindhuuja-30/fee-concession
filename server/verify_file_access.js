const mongoose = require('mongoose');
const User = require('./models/User');
const Concession = require('./models/Concession');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Node 18+ has built-in fetch

async function runVerification() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/fee_concession_db');
        console.log('Connected to MongoDB');

        // 1. Get Users
        const admin = await User.findOne({ role: 'admin' });
        const student = await User.findOne({ role: 'student' }); // Just any student

        if (!admin) {
            console.error('No admin found');
            process.exit(1);
        }
        if (!student) {
            console.warn('No student found');
        }

        console.log(`Admin ID: ${admin._id}`);
        if (student) console.log(`Student ID: ${student._id}`);

        // 2. Pick a file to test
        const uploadsDir = path.join(__dirname, 'uploads');
        const files = fs.readdirSync(uploadsDir);
        if (files.length === 0) {
            console.error('No files in uploads directory to test');
            process.exit(1);
        }
        const testFile = files[0];
        console.log(`Testing with file: ${testFile}`);

        // 3. Test Admin Access
        console.log('\n--- Testing Admin Access ---');
        const adminUrl = `http://localhost:5000/api/file-preview/${testFile}?userId=${admin._id}`;
        const adminRes = await fetch(adminUrl);
        console.log(`Status: ${adminRes.status}`);
        if (adminRes.status === 200) console.log('✅ Admin Access Success');
        else console.log('❌ Admin Access Failed');

        // 4. Test Student Access (if we have one)
        if (student) {
            console.log('\n--- Testing Student Access ---');
            // Check if student owns the file
            let isOwner = false;
            if (student.documents && Object.values(student.documents).includes(testFile)) isOwner = true;
            else {
                const concessions = await Concession.find({ studentId: student._id });
                for (const app of concessions) {
                    if (app.documents && app.documents.includes(testFile)) {
                        isOwner = true;
                        break;
                    }
                }
            }

            const studentUrl = `http://localhost:5000/api/file-preview/${testFile}?userId=${student._id}`;
            const studentRes = await fetch(studentUrl);
            console.log(`Status: ${studentRes.status}`);

            if (isOwner) {
                if (studentRes.status === 200) console.log('✅ Owner Access Success (Expected)');
                else console.log('❌ Owner Access Failed (Unexpected)');
            } else {
                if (studentRes.status === 403) console.log('✅ Non-Owner Access Denied (Expected)');
                else if (studentRes.status === 200) console.log('❌ Non-Owner Access Allowed (Security Issue!)');
                else console.log(`❓ Non-Owner Access Status: ${studentRes.status}`);
            }
        }

        // 5. Test Public/No-Auth Access
        console.log('\n--- Testing Public Access (No User ID) ---');
        const publicUrl = `http://localhost:5000/api/file-preview/${testFile}`; // No query param
        const publicRes = await fetch(publicUrl);
        console.log(`Status: ${publicRes.status}`);
        if (publicRes.status === 401) console.log('✅ Public Access Denied (Expected)');
        else console.log('❌ Public Access Allowed (Security Issue!) - Status: ' + publicRes.status);

    } catch (err) {
        console.error('Verification Error:', err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

runVerification();
