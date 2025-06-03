const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  expectedArrivalTime: {
    type: Date,
    required: true
  },
  actualArrivalTime: {
    type: Date,
    required: true
  },
  minutesLate: {
    type: Number,
    required: true
  }
});

module.exports = mongoose.model('Attendance', AttendanceSchema); 