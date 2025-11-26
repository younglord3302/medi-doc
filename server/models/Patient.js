const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  age: {
    type: Number,
    required: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
  },
  phone: {
    type: String
  },
  email: {
    type: String
  },
  diagnosis: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Patient', patientSchema);
