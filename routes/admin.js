const express = require('express');
const router = express.Router();
const User = require('../models/User');
const QRCode = require('../models/QRCode');
const Attendance = require('../models/Attendance');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator');
const crypto = require('crypto');
const mongoose = require('mongoose');

// Add this middleware function at the top of the file
const adminOrManager = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    if (user.role !== 'admin' && user.role !== 'manager') {
      return res.status(403).json({ msg: 'Access denied. Admin or Manager only.' });
    }

    next();
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

// @route   GET api/admin/employees
// @desc    Get all employees
// @access  Private/Admin
router.get('/employees', [auth, admin], async (req, res) => {
  try {
    const employees = await User.find({ role: 'employee' })
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(employees);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/admin/employees
// @desc    Create a new employee
// @access  Private/Admin
router.post('/employees', [
  auth,
  admin,
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
    check('salary', 'Salary is required').isNumeric(),
    check('workingHours.start', 'Start time is required').not().isEmpty(),
    check('workingHours.end', 'End time is required').not().isEmpty(),
    check('department', 'Department is required').not().isEmpty()
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password, salary, workingHours, department } = req.body;

  try {
    let employee = await User.findOne({ email });
    if (employee) {
      return res.status(400).json({ msg: 'Employee already exists' });
    }

    employee = new User({
      name,
      email,
      password,
      role: 'employee',
      salary,
      workingHours,
      department
    });

    const salt = await bcrypt.genSalt(10);
    employee.password = await bcrypt.hash(password, salt);

    await employee.save();
    
    const returnEmployee = await User.findById(employee._id).select('-password');
    res.json(returnEmployee);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/admin/employees/:id
// @desc    Update an employee
// @access  Private/Admin
router.put('/employees/:id', [auth, admin], async (req, res) => {
  const { name, email, salary, workingHours, department } = req.body;

  try {
    let employee = await User.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ msg: 'Employee not found' });
    }

    if (employee.role !== 'employee') {
      return res.status(400).json({ msg: 'Can only update employees' });
    }

    // Build employee object
    const employeeFields = {};
    if (name) employeeFields.name = name;
    if (email) employeeFields.email = email;
    if (salary) employeeFields.salary = salary;
    if (workingHours) employeeFields.workingHours = workingHours;
    if (department) employeeFields.department = department;

    employee = await User.findByIdAndUpdate(
      req.params.id,
      { $set: employeeFields },
      { new: true }
    ).select('-password');

    res.json(employee);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/admin/employees/:id
// @desc    Delete an employee
// @access  Private/Admin
router.delete('/employees/:id', [auth, admin], async (req, res) => {
  try {
    const employee = await User.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ msg: 'Employee not found' });
    }

    if (employee.role !== 'employee') {
      return res.status(400).json({ msg: 'Can only delete employees' });
    }

    await User.findByIdAndRemove(req.params.id);
    res.json({ msg: 'Employee removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/admin/qr-codes
// @desc    Generate a new QR code
// @access  Private/Admin or Manager
router.post('/qr-codes', [
  auth,
  adminOrManager,
  [
    check('branch', 'Branch name is required').not().isEmpty(),
    check('type', 'Type must be either checkIn or checkOut').isIn(['checkIn', 'checkOut']),
    check('validityHours', 'Validity hours must be a positive number').isInt({ min: 1 })
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { branch, type, validityHours } = req.body;

    // Generate a shorter unique code
    const code = crypto.randomBytes(16).toString('hex');
    
    // Set validity period
    const validFrom = new Date();
    const validUntil = new Date(validFrom.getTime() + validityHours * 60 * 60 * 1000);

    // Deactivate existing active QR codes for the same branch and type
    await QRCode.updateOne(
      { 
        branch,
        type,
        isActive: true
      },
      { 
        $set: { isActive: false }
      }
    );

    // Create new QR code
    const qrCode = new QRCode({
      code,
      branch,
      type,
      validFrom,
      validUntil,
      createdBy: req.user.id,
      isActive: true
    });

    await qrCode.save();
    
    // Populate creator info before sending response
    await qrCode.populate('createdBy', 'name');
    
    res.json(qrCode);
  } catch (err) {
    console.error('QR Code generation error:', err);
    res.status(500).json({ msg: 'Error generating QR code', error: err.message });
  }
});

// @route   GET api/admin/qr-codes
// @desc    Get all QR codes
// @access  Private/Admin or Manager
router.get('/qr-codes', [auth, adminOrManager], async (req, res) => {
  try {
    const qrCodes = await QRCode.find()
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name');
    res.json(qrCodes);
  } catch (err) {
    console.error('QR Code fetch error:', err);
    res.status(500).json({ msg: 'Error fetching QR codes', error: err.message });
  }
});

// @route   GET api/admin/qr-codes/active
// @desc    Get all active QR codes
// @access  Private/Admin or Manager
router.get('/qr-codes/active', [auth, adminOrManager], async (req, res) => {
  try {
    const now = new Date();
    const qrCodes = await QRCode.find({
      isActive: true,
      validFrom: { $lte: now },
      validUntil: { $gte: now }
    })
    .sort({ createdAt: -1 })
    .populate('createdBy', 'name');
    res.json(qrCodes);
  } catch (err) {
    console.error('Active QR Code fetch error:', err);
    res.status(500).json({ msg: 'Error fetching active QR codes', error: err.message });
  }
});

// @route   DELETE api/admin/qr-codes/:id
// @desc    Deactivate a QR code
// @access  Private/Admin
router.delete('/qr-codes/:id', [auth, adminOrManager], async (req, res) => {
  try {
    // Use findOneAndUpdate instead of findById + save
    const qrCode = await QRCode.findOneAndUpdate(
      { _id: req.params.id },
      { $set: { isActive: false } },
      { new: true }
    );

    if (!qrCode) {
      return res.status(404).json({ msg: 'QR code not found' });
    }

    res.json({ msg: 'QR code deactivated', qrCode });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/admin/dashboard/stats
// @desc    Get dashboard statistics
// @access  Private/Admin
router.get('/dashboard/stats', [auth, admin], async (req, res) => {
  try {
    // Get total employees
    const totalEmployees = await User.countDocuments({ role: 'employee' });

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's attendance
    const todayAttendance = await Attendance.countDocuments({
      timestamp: { $gte: today, $lt: tomorrow }
    });

    // Get present employees today
    const presentToday = await Attendance.distinct('employee', {
      timestamp: { $gte: today, $lt: tomorrow },
      type: 'checkIn'
    }).length;

    // Calculate absent employees
    const absentToday = totalEmployees - presentToday;

    res.json({
      totalEmployees,
      todayAttendance,
      presentToday,
      absentToday
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ 
      message: 'Error fetching dashboard statistics',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// @route   GET api/admin/dashboard/recent-attendance
// @desc    Get recent attendance records
// @access  Private/Admin
router.get('/dashboard/recent-attendance', [auth, admin], async (req, res) => {
  try {
    const recentAttendance = await Attendance.find()
      .sort({ timestamp: -1 })
      .limit(10)
      .populate('employee', 'name department')
      .lean();

    if (!recentAttendance) {
      return res.json([]);
    }

    res.json(recentAttendance);
  } catch (err) {
    console.error('Recent attendance error:', err);
    res.status(500).json({ 
      message: 'Error fetching recent attendance',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// @route   GET api/admin/reports/attendance
// @desc    Get filtered attendance records
// @access  Private/Admin
router.get('/reports/attendance', [auth, admin], async (req, res) => {
  try {
    const { startDate, endDate, employeeId, department, type } = req.query;
    
    // Build filter object
    const filter = {};
    
    // Date range filter
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Department filter
    if (department) {
      filter.department = department;
    }

    // Employee filter
    if (employeeId) {
      filter.employee = employeeId;
    }

    // Status filter (present, absent, late)
    if (type) {
      filter.status = type;
    }

    const attendanceRecords = await Attendance.find(filter)
      .populate('employee', 'name email department')
      .sort({ date: -1 });

    res.json(attendanceRecords);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/admin/reports/summary
// @desc    Get attendance summary for employees
// @access  Private/Admin
router.get('/reports/summary', [auth, admin], async (req, res) => {
  try {
    const { startDate, endDate, department } = req.query;
    
    // Build match stage for aggregation
    const matchStage = {};
    
    if (startDate && endDate) {
      matchStage.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (department) {
      matchStage.department = department;
    }

    const summary = await Attendance.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$employee',
          totalDays: { $count: {} },
          presentDays: {
            $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
          },
          absentDays: {
            $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] }
          },
          lateDays: {
            $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'employeeInfo'
        }
      },
      { $unwind: '$employeeInfo' },
      {
        $project: {
          _id: 1,
          employeeName: '$employeeInfo.name',
          department: '$employeeInfo.department',
          totalDays: 1,
          presentDays: 1,
          absentDays: 1,
          lateDays: 1,
          presentPercentage: {
            $multiply: [
              { $divide: ['$presentDays', '$totalDays'] },
              100
            ]
          }
        }
      }
    ]);

    res.json(summary);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/admin/reports/salary
// @desc    Get salary reports for employees
// @access  Private/Admin
router.get('/reports/salary', [auth, admin], async (req, res) => {
  try {
    const { startDate, endDate, department } = req.query;
    console.log('Salary report request received:', { startDate, endDate, department });
    
    if (!startDate || !endDate) {
      console.log('Missing date parameters');
      return res.status(400).json({ msg: 'Please provide start and end dates' });
    }

    // Build match stage for aggregation
    const matchStage = {
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    if (department) {
      matchStage.department = department;
    }

    // Get all employees first
    const employeeQuery = department ? { department, role: 'employee' } : { role: 'employee' };
    console.log('Employee query:', employeeQuery);
    const employees = await User.find(employeeQuery).select('name department salary workingHours');
    console.log(`Found ${employees.length} employees`);

    if (employees.length === 0) {
      console.log('No employees found');
      return res.json({
        overall: {
          totalEmployees: 0,
          totalSalary: 0,
          totalDeductions: 0,
          totalFinalSalary: 0
        },
        departments: []
      });
    }

    // Get attendance records for the period
    console.log('Fetching attendance records with match stage:', matchStage);
    const attendanceRecords = await Attendance.aggregate([
      { $match: matchStage },
      {
        $addFields: {
          expectedCheckInDate: {
            $dateFromString: {
              dateString: '$expectedCheckIn'
            }
          }
        }
      },
      {
        $group: {
          _id: '$employee',
          totalDays: { $count: {} },
          totalWorkingMinutes: {
            $sum: {
              $cond: [
                { $and: [
                  { $in: ['$status', ['present', 'late']] },
                  { $ne: [{ $type: '$checkIn.time' }, 'missing'] },
                  { $ne: [{ $type: '$checkOut.time' }, 'missing'] }
                ]},
                {
                  $divide: [
                    { $subtract: ['$checkOut.time', '$checkIn.time'] },
                    60000 // Convert milliseconds to minutes
                  ]
                },
                0
              ]
            }
          },
          totalLateMinutes: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'late'] },
                {
                  $max: [
                    {
                      $divide: [
                        { $subtract: ['$checkIn.time', '$expectedCheckInDate'] },
                        60000 // Convert milliseconds to minutes
                      ]
                    },
                    0
                  ]
                },
                0
              ]
            }
          },
          presentDays: {
            $sum: {
              $cond: [{ $eq: ['$status', 'present'] }, 1, 0]
            }
          },
          lateDays: {
            $sum: {
              $cond: [{ $eq: ['$status', 'late'] }, 1, 0]
            }
          },
          absentDays: {
            $sum: {
              $cond: [{ $eq: ['$status', 'absent'] }, 1, 0]
            }
          },
          lateRecords: {
            $push: {
              $cond: [
                { $eq: ['$status', 'late'] },
                {
                  date: '$date',
                  expectedTime: '$expectedCheckIn',
                  actualTime: '$checkIn.time',
                  lateMinutes: {
                    $divide: [
                      { $subtract: ['$checkIn.time', '$expectedCheckInDate'] },
                      60000
                    ]
                  }
                },
                null
              ]
            }
          }
        }
      }
    ]);
    console.log(`Found ${attendanceRecords.length} attendance records`);

    // Calculate salary reports
    const salaryReports = employees.map(employee => {
      const attendance = attendanceRecords.find(record => 
        record._id?.toString() === employee._id?.toString()
      ) || { 
        totalWorkingMinutes: 0, 
        totalLateMinutes: 0, 
        totalDays: 0,
        presentDays: 0,
        lateDays: 0,
        absentDays: 0,
        lateRecords: []
      };

      // Calculate daily working hours from employee schedule
      const [startHour, startMinute] = employee.workingHours.start.split(':');
      const [endHour, endMinute] = employee.workingHours.end.split(':');
      const scheduledHoursPerDay = 
        (parseInt(endHour) * 60 + parseInt(endMinute) - 
        (parseInt(startHour) * 60 + parseInt(startMinute))) / 60;

      // Calculate total expected working days (excluding weekends)
      const start = new Date(startDate);
      const end = new Date(endDate);
      let expectedWorkingDays = 0;
      for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
        if (d.getDay() !== 0 && d.getDay() !== 6) { // Skip weekends
          expectedWorkingDays++;
        }
      }

      // Calculate expected total working hours for the period
      const expectedTotalHours = expectedWorkingDays * scheduledHoursPerDay;
      
      // Calculate actual working hours
      const actualWorkingHours = attendance.totalWorkingMinutes / 60;
      
      // Calculate missing/late hours
      const missingHours = Math.max(0, expectedTotalHours - actualWorkingHours);
      
      // Calculate salary per hour
      const salaryPerHour = employee.salary / (22 * scheduledHoursPerDay); // Based on standard 22 working days
      
      // Calculate base salary for actual worked hours
      const baseSalary = actualWorkingHours * salaryPerHour;
      
      // Calculate deductions
      // Missing/Late hours deduction (using regular hourly rate)
      const missingHoursDeduction = missingHours * salaryPerHour;
      
      // Total deductions
      const totalDeduction = missingHoursDeduction;
      
      // Calculate final salary
      const finalSalary = Math.max(0, baseSalary - totalDeduction);

      // Log calculations for debugging
      console.log(`${employee.name} calculations:`, {
        expectedWorkingDays,
        expectedTotalHours,
        actualWorkingHours,
        missingHours,
        salaryPerHour,
        missingHoursDeduction,
        baseSalary,
        finalSalary
      });

      return {
        employeeId: employee._id,
        name: employee.name,
        department: employee.department,
        totalWorkingHours: actualWorkingHours.toFixed(2),
        expectedWorkingHours: expectedTotalHours.toFixed(2),
        missingHours: missingHours.toFixed(2),
        salaryPerHour: salaryPerHour.toFixed(2),
        totalSalary: baseSalary.toFixed(2),
        totalDeduction: totalDeduction.toFixed(2),
        finalSalary: finalSalary.toFixed(2),
        totalDays: attendance.totalDays,
        presentDays: attendance.presentDays,
        lateDays: attendance.lateDays,
        absentDays: attendance.absentDays
      };
    });
    console.log(`Generated ${salaryReports.length} salary reports`);

    // Group by department
    const departmentSummaries = {};
    salaryReports.forEach(report => {
      if (!departmentSummaries[report.department]) {
        departmentSummaries[report.department] = {
          department: report.department,
          totalEmployees: 0,
          totalSalary: 0,
          totalDeductions: 0,
          totalFinalSalary: 0,
          employees: []
        };
      }
      departmentSummaries[report.department].totalEmployees++;
      departmentSummaries[report.department].totalSalary += parseFloat(report.totalSalary);
      departmentSummaries[report.department].totalDeductions += parseFloat(report.totalDeduction);
      departmentSummaries[report.department].totalFinalSalary += parseFloat(report.finalSalary);
      departmentSummaries[report.department].employees.push(report);
    });

    const response = {
      overall: {
        totalEmployees: salaryReports.length,
        totalSalary: salaryReports.reduce((sum, report) => sum + parseFloat(report.totalSalary), 0),
        totalDeductions: salaryReports.reduce((sum, report) => sum + parseFloat(report.totalDeduction), 0),
        totalFinalSalary: salaryReports.reduce((sum, report) => sum + parseFloat(report.finalSalary), 0)
      },
      departments: Object.values(departmentSummaries)
    };

    console.log('Sending response with overall summary:', response.overall);
    res.json(response);
  } catch (err) {
    console.error('Salary report error details:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

module.exports = router; 