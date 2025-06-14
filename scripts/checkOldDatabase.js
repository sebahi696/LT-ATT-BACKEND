const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');

async function checkOldDatabase() {
  try {
    // Connect to the old database (LT-ATT-APP)
    const oldDbUri = process.env.MONGO_URI; // This should point to LT-ATT-APP
    await mongoose.connect(oldDbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to database:', mongoose.connection.db.databaseName);
    
    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\nAll collections in database:');
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });
    
    // Check users collection specifically
    console.log('\nChecking users collection:');
    const users = await User.find({});
    console.log(`Found ${users.length} users:`);
    users.forEach(u => {
      console.log(`- ${u.email} (role: ${u.role})`);
    });
    
    // Also check if there are documents in users collection directly
    const userCount = await mongoose.connection.db.collection('users').countDocuments();
    console.log(`\nDirect count from users collection: ${userCount}`);
    
    process.exit(0);
  } catch (err) {
    console.error('Error checking database:', err);
    process.exit(1);
  }
}

checkOldDatabase(); 