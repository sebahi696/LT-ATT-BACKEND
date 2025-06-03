const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
<<<<<<< HEAD
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
=======
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
>>>>>>> 22ff5191947ffcd885f47517df388e6a65239926
    required: true
  },
  date: {
    type: Date,
    required: true
  },
<<<<<<< HEAD
  checkIn: {
    time: Date,
    qrCode: String
  },
  checkOut: {
    time: Date,
    qrCode: String
  },
  department: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late'],
    default: 'absent'
  }
});

// Create a compound index for employee and date to ensure unique daily records
AttendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

=======
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

>>>>>>> 22ff5191947ffcd885f47517df388e6a65239926
module.exports = mongoose.model('Attendance', AttendanceSchema); 