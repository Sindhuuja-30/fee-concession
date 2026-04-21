const mongoose = require('mongoose');
require('dotenv').config();

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/fee_concession_db';

console.log(`🔍 Checking MongoDB connection to: ${mongoUri}`);

mongoose.connect(mongoUri)
  .then(() => {
    console.log('✅ SUCCESS: Successfully connected to MongoDB.');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ ERROR: Could not connect to MongoDB.');
    console.error(`- Error Name: ${err.name}`);
    console.error(`- Error Message: ${err.message}`);
    
    if (err.message.includes('ECONNREFUSED')) {
      console.error('\n💡 HINT: The MongoDB service does not appear to be running. Please start it on your machine.');
    } else if (err.name === 'MongooseServerSelectionError') {
      console.error('\n💡 HINT: Server selection failed. Check if the database host is correct and reachable.');
    }
    
    process.exit(1);
  });
