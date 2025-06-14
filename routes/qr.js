const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { roles, checkRole } = require('../middleware/roles');
const QRCode = require('../models/QRCode');
const qrcode = require('qrcode');

// @route   POST /api/qr/generate
// @desc    Generate a new QR code
// @access  Private (Admin/Manager)
router.post('/generate', [auth, checkRole(roles.manager)], async (req, res) => {
  try {
    const { departmentId, location } = req.body;

    // Generate a unique code
    const code = `QR${Date.now()}${Math.random().toString(36).substring(7)}`;

    // Create QR code record
    const qrCodeRecord = new QRCode({
      code,
      department: departmentId,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // Valid for 24 hours
      isActive: true,
      createdBy: req.user.id,
      location: {
        type: 'Point',
        coordinates: location
      }
    });

    await qrCodeRecord.save();

    // Generate QR code image
    const qrImage = await qrcode.toDataURL(code);

    res.json({
      qrCode: qrCodeRecord,
      qrImage
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/qr/codes
// @desc    Get all QR codes
// @access  Private (Admin/Manager)
router.get('/codes', [auth, checkRole(roles.manager)], async (req, res) => {
  try {
    const qrCodes = await QRCode.find()
      .populate('department')
      .populate('createdBy', '-password');
    res.json(qrCodes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/qr/validate
// @desc    Validate a QR code
// @access  Private
router.post('/validate', auth, async (req, res) => {
  try {
    const { code } = req.body;

    const qrCode = await QRCode.findOne({
      code,
      isActive: true,
      validFrom: { $lte: new Date() },
      validUntil: { $gte: new Date() }
    });

    res.json({
      valid: !!qrCode,
      qrCode
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 