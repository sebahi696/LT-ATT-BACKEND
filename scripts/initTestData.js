<<<<<<< HEAD
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Attendance = require('../models/Attendance');

const testEmployees = [
  {
    name: 'John Smith',
    email: 'john@latavola.com',
    password: 'employee123',
    role: 'employee',
    salary: 3000,
    workingHours: {
      start: '09:00',
      end: '17:00'
    },
    department: 'Kitchen'
  },
  {
    name: 'Sarah Johnson',
    email: 'sarah@latavola.com',
    password: 'employee123',
    role: 'employee',
    salary: 2800,
    workingHours: {
      start: '08:00',
      end: '16:00'
    },
    department: 'Service'
  },
  {
    name: 'Mike Wilson',
    email: 'mike@latavola.com',
    password: 'employee123',
    role: 'employee',
    salary: 2500,
    workingHours: {
      start: '10:00',
      end: '18:00'
    },
    department: 'Bar'
  },
  {
    name: 'Emily Chen',
    email: 'emily@latavola.com',
    password: 'employee123',
    role: 'employee',
    salary: 3200,
    workingHours: {
      start: '08:00',
      end: '16:00'
    },
    department: 'Kitchen'
  },
  {
    name: 'David Brown',
    email: 'david@latavola.com',
    password: 'employee123',
    role: 'employee',
    salary: 2600,
    workingHours: {
      start: '09:00',
      end: '17:00'
    },
    department: 'Service'
  },
  {
    name: 'Lisa Martinez',
    email: 'lisa@latavola.com',
    password: 'employee123',
    role: 'employee',
    salary: 2900,
    workingHours: {
      start: '11:00',
      end: '19:00'
    },
    department: 'Bar'
  },
  {
    name: 'Alex Wong',
    email: 'alex@latavola.com',
    password: 'employee123',
    role: 'employee',
    salary: 3100,
    workingHours: {
      start: '08:30',
      end: '16:30'
    },
    department: 'Kitchen'
  },
  {
    name: 'Maria Garcia',
    email: 'maria@latavola.com',
    password: 'employee123',
    role: 'employee',
    salary: 2700,
    workingHours: {
      start: '10:30',
      end: '18:30'
    },
    department: 'Service'
  }
];

// Function to generate attendance records for May 2024
const generateAttendanceRecords = async (employees) => {
  const records = [];
  
  // Generate records for May 2024 (1-31)
  for (let day = 1; day <= 31; day++) {
    const date = new Date(2024, 4, day); // Month is 0-based, so 4 = May
    
    for (const employee of employees) {
      // Skip weekends (Saturday = 6, Sunday = 0)
      if (date.getDay() === 0 || date.getDay() === 6) {
        continue;
      }

      const [startHour, startMinute] = employee.workingHours.start.split(':');
      const [endHour, endMinute] = employee.workingHours.end.split(':');
      
      // Create different scenarios based on employee and day
      let scenario = '';
      
      // First week: Normal attendance
      if (day <= 7) {
        scenario = 'normal';
      }
      // Second week: Some late arrivals
      else if (day <= 14) {
        scenario = Math.random() < 0.3 ? 'late' : 'normal';
      }
      // Third week: Mix of absences and normal
      else if (day <= 21) {
        scenario = Math.random() < 0.2 ? 'absent' : 'normal';
      }
      // Fourth week: Mix of all scenarios
      else {
        const rand = Math.random();
        scenario = rand < 0.6 ? 'normal' : (rand < 0.8 ? 'late' : 'absent');
      }

      // Calculate times based on scenario
      const expectedCheckIn = new Date(date);
      expectedCheckIn.setHours(parseInt(startHour), parseInt(startMinute), 0, 0);

      if (scenario === 'absent') {
        records.push({
          employee: employee._id,
          date: date,
          department: employee.department,
          status: 'absent',
          expectedCheckIn: expectedCheckIn.toISOString()
        });
        continue;
      }

      let checkInTime = new Date(date);
      let checkOutTime = new Date(date);

      if (scenario === 'normal') {
        // Random check-in time (0-5 minutes early or late)
        checkInTime.setHours(
          parseInt(startHour),
          parseInt(startMinute) + Math.floor(Math.random() * 11) - 5
        );
        
        // Random check-out time (0-5 minutes early or late)
        checkOutTime.setHours(
          parseInt(endHour),
          parseInt(endMinute) + Math.floor(Math.random() * 11) - 5
        );
      } else if (scenario === 'late') {
        // Late arrival (15-45 minutes late)
        const lateMinutes = 15 + Math.floor(Math.random() * 31);
        checkInTime.setHours(
          parseInt(startHour),
          parseInt(startMinute) + lateMinutes
        );
        
        // Normal check-out
        checkOutTime.setHours(
          parseInt(endHour),
          parseInt(endMinute) + Math.floor(Math.random() * 11) - 5
        );

        console.log(`Generated late record: Expected ${startHour}:${startMinute}, Actual: ${checkInTime.getHours()}:${checkInTime.getMinutes()}, Late by: ${lateMinutes} minutes`);
      }

      records.push({
        employee: employee._id,
        date: date,
        checkIn: {
          time: checkInTime
        },
        checkOut: {
          time: checkOutTime
        },
        expectedCheckIn: expectedCheckIn.toISOString(),
        department: employee.department,
        status: scenario === 'late' ? 'late' : 'present'
      });
    }
  }

  return records;
};

const initializeTestData = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/LTAPP', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB Connected to LTAPP database');

    // Clear existing test employees (keeping admin accounts)
    await User.deleteMany({ role: 'employee' });
    console.log('Cleared existing test employees');

    // Clear all attendance records
    await Attendance.deleteMany({});
    console.log('Cleared existing attendance records');

    // Create test employees
    const createdEmployees = [];
    for (const employeeData of testEmployees) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(employeeData.password, salt);
      
      const employee = await User.create({
        ...employeeData,
        password: hashedPassword
      });
      createdEmployees.push(employee);
      console.log(`Created test employee: ${employee.email}`);
    }

    // Generate and create attendance records
    const attendanceRecords = await generateAttendanceRecords(createdEmployees);
=======
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

>>>>>>> 22ff5191947ffcd885f47517df388e6a65239926
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