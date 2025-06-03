const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/LTAPP';

const initializeUsers = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Clear existing users
    await User.deleteMany({});
    console.log('Cleared existing users');

    // Create admin user
    const adminSalt = await bcrypt.genSalt(10);
    const adminHash = await bcrypt.hash('admin1', adminSalt);
    await User.create({
      name: 'Admin User',
      email: 'admin@latavola.com',
      password: adminHash,
      role: 'admin'
    });
    console.log('Admin user created');

    // Create manager user
    const managerSalt = await bcrypt.genSalt(10);
    const managerHash = await bcrypt.hash('manager1', managerSalt);
    await User.create({
      name: 'Manager User',
      email: 'manager@latavola.com',
      password: managerHash,
      role: 'manager'
    });
    console.log('Manager user created');

    // Create employee user
    const employeeSalt = await bcrypt.genSalt(10);
    const employeeHash = await bcrypt.hash('employee1', employeeSalt);
    await User.create({
      name: 'Employee User',
      email: 'employee@latavola.com',
      password: employeeHash,
      role: 'employee'
    });
    console.log('Employee user created');

    console.log('All users created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing users:', error);
    process.exit(1);
  }
};

initializeUsers(); 