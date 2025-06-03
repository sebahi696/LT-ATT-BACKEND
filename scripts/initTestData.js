const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/LTAPP';

const initializeTestData = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Clear existing test data
    await Employee.deleteMany({});
    await Attendance.deleteMany({});
    console.log('Cleared existing test data');

    // Create test employees
    const testEmployees = [
      { name: 'John Smith', email: 'john@latavola.com', department: 'Kitchen', position: 'Chef' },
      { name: 'Sarah Johnson', email: 'sarah@latavola.com', department: 'Service', position: 'Server' },
      { name: 'Mike Wilson', email: 'mike@latavola.com', department: 'Bar', position: 'Bartender' },
      { name: 'Emily Brown', email: 'emily@latavola.com', department: 'Kitchen', position: 'Sous Chef' },
      { name: 'David Lee', email: 'david@latavola.com', department: 'Service', position: 'Host' },
      { name: 'Lisa Garcia', email: 'lisa@latavola.com', department: 'Bar', position: 'Bartender' },
      { name: 'Alex Taylor', email: 'alex@latavola.com', department: 'Kitchen', position: 'Line Cook' },
      { name: 'Maria Rodriguez', email: 'maria@latavola.com', department: 'Service', position: 'Server' }
    ];

    const employees = await Employee.insertMany(testEmployees);
    console.log('Test employees created');

    // Generate attendance records for the past 30 days
    const attendanceRecords = [];
    const now = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      for (const employee of employees) {
        // Random attendance record (80% chance of attendance)
        if (Math.random() < 0.8) {
          const expectedTime = new Date(date);
          expectedTime.setHours(9, 0, 0, 0);
          
          // Random lateness (0-60 minutes)
          const lateMinutes = Math.floor(Math.random() * 60);
          const actualTime = new Date(expectedTime);
          actualTime.setMinutes(actualTime.getMinutes() + lateMinutes);
          
          attendanceRecords.push({
            employeeId: employee._id,
            date: date,
            expectedArrivalTime: expectedTime,
            actualArrivalTime: actualTime,
            minutesLate: lateMinutes
          });
        }
      }
    }

    await Attendance.insertMany(attendanceRecords);
    console.log(`Created ${attendanceRecords.length} attendance records`);

    console.log('Test data initialization completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing test data:', error);
    process.exit(1);
  }
};

initializeTestData(); 