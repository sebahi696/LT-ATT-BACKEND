const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const QRCode = require('../models/QRCode');
const Attendance = require('../models/Attendance');

// Middleware to ensure user is an employee
const employee = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    if (user.role !== 'employee') {
      return res.status(403).json({ msg: 'Access denied. Employee only.' });
    }
    next();
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

// @route   GET api/employee/attendance
// @desc    Get employee's attendance history
// @access  Private/Employee
router.get('/attendance', [auth, employee], async (req, res) => {
  try {
    const attendance = await Attendance.find({ employee: req.user.id })
      .sort({ date: -1 })
      .limit(30); // Get last 30 days

    // Calculate summary statistics
    const totalDays = attendance.length;
    const presentDays = attendance.filter(record => record.status === 'present').length;
    const lateDays = attendance.filter(record => record.status === 'late').length;
    const absentDays = attendance.filter(record => record.status === 'absent').length;
    const attendancePercentage = totalDays > 0 
      ? ((presentDays + lateDays) / totalDays) * 100 
      : 0;

    res.json({
      records: attendance,
      summary: {
        totalDays,
        presentDays,
        lateDays,
        absentDays,
        attendancePercentage
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/employee/attendance/scan
// @desc    Process QR code scan for attendance
// @access  Private/Employee
router.post('/attendance/scan', [auth, employee], async (req, res) => {
  try {
    const { qrCode } = req.body;
    if (!qrCode) {
      return res.status(400).json({ msg: 'QR code is required' });
    }

    // Find the QR code in the database
    const qrCodeDoc = await QRCode.findOne({ code: qrCode, isActive: true });
    if (!qrCodeDoc) {
      return res.status(400).json({ msg: 'Invalid or expired QR code' });
    }

    // Check if QR code is still valid
    const now = new Date();
    if (now < qrCodeDoc.validFrom || now > qrCodeDoc.validUntil) {
      return res.status(400).json({ msg: 'QR code has expired' });
    }

    // Get employee details
    const employee = await User.findById(req.user.id);
    if (!employee) {
      return res.status(404).json({ msg: 'Employee not found' });
    }

    // Get today's date (without time)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find or create today's attendance record
    let attendance = await Attendance.findOne({
      employee: req.user.id,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    if (!attendance) {
      attendance = new Attendance({
        employee: req.user.id,
        date: today,
        department: employee.department
      });
    }

    // Get expected check-in time
    const [expectedHour, expectedMinute] = employee.workingHours.start.split(':');
    const expectedTime = new Date(today);
    expectedTime.setHours(parseInt(expectedHour), parseInt(expectedMinute), 0, 0);

    // Process check-in or check-out
    if (qrCodeDoc.type === 'checkIn') {
      if (attendance.checkIn?.time) {
        return res.status(400).json({ msg: 'Already checked in today' });
      }

      attendance.checkIn = {
        time: now,
        qrCode: qrCode
      };

      // Determine if late
      attendance.status = now > expectedTime ? 'late' : 'present';
    } else {
      if (!attendance.checkIn?.time) {
        return res.status(400).json({ msg: 'Must check in before checking out' });
      }
      if (attendance.checkOut?.time) {
        return res.status(400).json({ msg: 'Already checked out today' });
      }

      attendance.checkOut = {
        time: now,
        qrCode: qrCode
      };
    }

    await attendance.save();

    res.json({
      msg: `Successfully ${qrCodeDoc.type === 'checkIn' ? 'checked in' : 'checked out'}`,
      attendance
    });
  } catch (err) {
    console.error('Attendance scan error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

module.exports = router; 