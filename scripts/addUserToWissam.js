const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');

async function addUserToWissam() {
  try {
    // Connect to the wissam database
    const wissamDbUri = process.env.MONGO_URI.replace('/LT-ATT-APP', '/wissam');
    console.log('Connecting to wissam database...');
    
    await mongoose.connect(wissamDbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to database:', mongoose.connection.db.databaseName);
    
    // Check if admin user already exists
    let existingUser = await User.findOne({ email: 'admin@latavola.com' });
    if (existingUser) {
      console.log('Admin user already exists in wissam database');
      process.exit(0);
    }
    
    // Create admin user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin1', salt);
    
    const adminUser = new User({
      name: 'Admin User',
      email: 'admin@latavola.com',
      password: hashedPassword,
      role: 'admin'
    });
    
    await adminUser.save();
    console.log('✅ Admin user created successfully in wissam database!');
    console.log('Email: admin@latavola.com');
    console.log('Password: admin1');
    console.log('Role: admin');
    
    // Verify the user was created
    const users = await User.find({});
    console.log(`\nTotal users in wissam database: ${users.length}`);
    users.forEach(u => {
      console.log(`- ${u.email} (role: ${u.role})`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error('Error adding user to wissam database:', err);
    process.exit(1);
  }
}

addUserToWissam(); 