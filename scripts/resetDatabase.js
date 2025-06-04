const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('../models/User');
const Employee = require('../models/Employee');
const Department = require('../models/Department');
const Attendance = require('../models/Attendance');
const QRCode = require('../models/QRCode');

dotenv.config();

const resetDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Drop existing collections
    await Promise.all([
      mongoose.connection.collection('users').drop(),
      mongoose.connection.collection('employees').drop(),
      mongoose.connection.collection('departments').drop(),
      mongoose.connection.collection('attendances').drop(),
      mongoose.connection.collection('qrcodes').drop()
    ]).catch(err => console.log('Collections may not exist, continuing...'));

    console.log('Dropped existing collections');

    // Create default admin user
    const adminPassword = await bcrypt.hash('admin1', 10);
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@latavola.com',
      password: adminPassword,
      role: 'admin'
    });

    console.log('Created admin user');

    // Create default departments
    const departments = await Department.insertMany([
      {
        name: 'Kitchen',
        description: 'Main kitchen department'
      },
      {
        name: 'Service',
        description: 'Front of house service department'
      },
      {
        name: 'Bar',
        description: 'Bar and beverages department'
      }
    ]);

    console.log('Created default departments');

    // Create default manager users for each department
    const managerPassword = await bcrypt.hash('manager1', 10);
    const managers = await Promise.all(departments.map(async (dept, index) => {
      const manager = await User.create({
        name: `${dept.name} Manager`,
        email: `manager${index + 1}@latavola.com`,
        password: managerPassword,
        role: 'manager',
        department: dept._id
      });

      // Update department with manager
      await Department.findByIdAndUpdate(dept._id, { manager: manager._id });

      return manager;
    }));

    console.log('Created department managers');

    // Create some example employees
    const employeePassword = await bcrypt.hash('employee1', 10);
    const employees = [];

    for (let i = 0; i < departments.length; i++) {
      const dept = departments[i];
      
      // Create 3 employees per department
      for (let j = 1; j <= 3; j++) {
        const employeeUser = await User.create({
          name: `${dept.name} Employee ${j}`,
          email: `employee${i}${j}@latavola.com`,
          password: employeePassword,
          role: 'employee',
          department: dept._id
        });

        const employee = await Employee.create({
          user: employeeUser._id,
          employeeId: `EMP${i}${j}`,
          department: dept._id,
          position: `${dept.name} Staff`,
          salary: 30000 + Math.floor(Math.random() * 10000),
          workingHours: {
            start: '09:00',
            end: '17:00'
          },
          joiningDate: new Date(),
          status: 'active'
        });

        employees.push(employee);
      }
    }

    console.log('Created example employees');

    // Create some example QR codes
    const qrCodes = await Promise.all(departments.map(dept => 
      QRCode.create({
        code: `QR${dept._id}`,
        department: dept._id,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // Valid for 24 hours
        isActive: true,
        createdBy: admin._id,
        location: {
          type: 'Point',
          coordinates: [73.856255, 18.516726] // Example coordinates
        }
      })
    ));

    console.log('Created example QR codes');

    // Create some example attendance records
    const today = new Date();
    for (const employee of employees) {
      await Attendance.create({
        employee: employee._id,
        date: today,
        checkIn: {
          time: new Date(today.setHours(9, Math.floor(Math.random() * 30))),
          location: {
            type: 'Point',
            coordinates: [73.856255, 18.516726]
          }
        },
        checkOut: {
          time: new Date(today.setHours(17, Math.floor(Math.random() * 30))),
          location: {
            type: 'Point',
            coordinates: [73.856255, 18.516726]
          }
        },
        status: 'present',
        workHours: 8,
        verifiedBy: managers[0]._id
      });
    }

    console.log('Created example attendance records');

    console.log('Database reset complete!');
    console.log('\nDefault login credentials:');
    console.log('Admin: admin@latavola.com / admin1');
    console.log('Managers: manager1@latavola.com / manager1');
    console.log('Employees: employee01@latavola.com / employee1');

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error resetting database:', error);
    process.exit(1);
  }
};

resetDatabase(); 