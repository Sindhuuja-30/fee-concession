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
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            throw new Error('MONGO_URI is not defined in environment variables');
        }

        const maskedUri = mongoUri.replace(/\/\/(.*):(.*)@/, '//***:***@');
        console.log(`🔍 Attempting to connect to MongoDB: ${maskedUri}`);

        await mongoose.connect(mongoUri);
        console.log('✅ MongoDB Connected');

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
