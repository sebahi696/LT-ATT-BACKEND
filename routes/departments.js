const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { roles, checkRole } = require('../middleware/roles');
const Department = require('../models/Department');

// @route   GET /api/departments
// @desc    Get all departments
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const departments = await Department.find()
      .populate('manager', '-password');
    res.json(departments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/departments
// @desc    Create a department
// @access  Private (Admin only)
router.post('/', [auth, checkRole(roles.admin)], async (req, res) => {
  try {
    const { name, description, manager } = req.body;

    const department = new Department({
      name,
      description,
      manager
    });

    await department.save();
    res.json(department);
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Department already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/departments/:id
// @desc    Update a department
// @access  Private (Admin only)
router.put('/:id', [auth, checkRole(roles.admin)], async (req, res) => {
  try {
    const department = await Department.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    ).populate('manager', '-password');

    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    res.json(department);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/departments/:id
// @desc    Delete a department
// @access  Private (Admin only)
router.delete('/:id', [auth, checkRole(roles.admin)], async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    await department.remove();
    res.json({ message: 'Department removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 