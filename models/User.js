const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'manager', 'employee'],
    default: 'employee'
  },
  salary: {
    type: Number,
    required: function() { return this.role === 'employee'; },
    default: function() { return this.role === 'employee' ? 0 : undefined; }
  },
  workingHours: {
    start: {
      type: String,
      required: function() { return this.role === 'employee'; },
      default: function() { return this.role === 'employee' ? '09:00' : undefined; }
    },
    end: {
      type: String,
      required: function() { return this.role === 'employee'; },
      default: function() { return this.role === 'employee' ? '17:00' : undefined; }
    }
  },
  department: {
    type: String,
    required: function() { return this.role === 'employee'; },
    default: function() { return this.role === 'employee' ? 'General' : undefined; }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', UserSchema); 