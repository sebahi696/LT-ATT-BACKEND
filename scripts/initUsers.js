const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');

const users = [
  {
    name: 'Admin',
    email: 'admin@latavola.com',
    password: 'admin1',
    role: 'admin'
  },
  {
    name: 'Manager',
    email: 'manager@latavola.com',
    password: 'manager1',
    role: 'manager'
  },
  {
    name: 'Employee',
    email: 'employee@latavola.com',
    password: 'employee1',
    role: 'employee'
  }
];

mongoose.connect('mongodb://localhost:27017/LTAPP', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('MongoDB Connected to LTAPP database');
  
  try {
    // Clear existing users
    await User.deleteMany({});
    console.log('Cleared existing users');

    // Create new users with hashed passwords
    for (const userData of users) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      await User.create({
        ...userData,
        password: hashedPassword
      });
      console.log(`Created user: ${userData.email} with role: ${userData.role}`);
    }

    console.log('All users created successfully in LTAPP database');
    process.exit(0);
  } catch (error) {
    console.error('Error creating users:', error);
    process.exit(1);
  }
})
.catch(err => {
  console.error('MongoDB Connection Error:', err);
  process.exit(1);
}); 