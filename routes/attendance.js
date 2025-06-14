const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { roles, checkRole } = require('../middleware/roles');
const Attendance = require('../models/Attendance');
const QRCode = require('../models/QRCode');
const { isWithinRadius } = require('../utils/location');

// @route   GET /api/attendance
// @desc    Get attendance records
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const attendance = await Attendance.find()
      .populate('employee')
      .populate('verifiedBy');
    res.json(attendance);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/attendance/mark
// @desc    Mark attendance using QR code
// @access  Private
router.post('/mark', auth, async (req, res) => {
  try {
    const { qrCode, location } = req.body;

    // Validate QR code
    const validQR = await QRCode.findOne({
      code: qrCode,
      isActive: true,
      validFrom: { $lte: new Date() },
      validUntil: { $gte: new Date() }
    });

    if (!validQR) {
      return res.status(400).json({ message: 'Invalid or expired QR code' });
    }

    // Check if user is within allowed radius
    if (!isWithinRadius(location, validQR.location.coordinates)) {
      return res.status(400).json({ message: 'You are not in the valid location' });
    }

    // Create attendance record
    const attendance = new Attendance({
      employee: req.user.id,
      date: new Date(),
      checkIn: {
        time: new Date(),
        location: {
          type: 'Point',
          coordinates: location
        }
      },
      status: 'present'
    });

    await attendance.save();
    res.json(attendance);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/attendance/report
// @desc    Get attendance report
// @access  Private (Admin/Manager)
router.get('/report', [auth, checkRole(roles.manager)], async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const query = {};
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const attendance = await Attendance.find(query)
      .populate('employee')
      .populate('verifiedBy');
    
    res.json(attendance);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 