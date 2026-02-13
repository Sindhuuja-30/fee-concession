const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const users = [
    {
        name: 'Admin User',
        email: 'admin@college.edu',
        password: 'admin123',
        role: 'admin'
    },
    {
        name: 'Student User',
        email: 'student@college.edu',
        password: 'student123',
        role: 'student'
    }
];

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/fee_concession_db');
        console.log('MongoDB Connected');

        // Check if users exist
        const count = await User.countDocuments();
        if (count === 0) {
            await User.insertMany(users);
            console.log('Seed Data Imported: Admin and Student created.');
        } else {
            console.log('Data already exists, skipping seed.');
        }

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedDB();
