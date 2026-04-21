const mongoose = require('mongoose');
const User = require('../models/User');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const normalizeEmails = async () => {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            throw new Error('MONGO_URI is not defined');
        }

        const maskedUri = mongoUri.replace(/\/\/(.*):(.*)@/, '//***:***@');
        console.log(`🔍 Connecting to MongoDB: ${maskedUri}`);

        await mongoose.connect(mongoUri);
        console.log('✅ MongoDB Connected');

        const users = await User.find({});
        console.log(`Found ${users.length} users to check.`);

        let updatedCount = 0;
        for (const user of users) {
            const originalEmail = user.email;
            const normalizedEmail = originalEmail.trim().toLowerCase();

            if (originalEmail !== normalizedEmail) {
                user.email = normalizedEmail;
                await user.save();
                console.log(`Updated email: "${originalEmail}" -> "${normalizedEmail}"`);
                updatedCount++;
            }
        }

        console.log(`Migration complete. Updated ${updatedCount} users.`);
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
};

normalizeEmails();
