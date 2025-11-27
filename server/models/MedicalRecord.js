const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  visitDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  diagnosis: {
    primary: String,
    secondary: [String]
  },
  symptoms: [String],
  vitalSigns: {
    bloodPressure: String,
    heartRate: Number,
    temperature: Number,
    weight: Number,
    height: Number,
    bmi: Number
  },
  medications: [{
    name: String,
    dosage: String,
    frequency: String,
    startDate: Date,
    endDate: Date,
    instructions: String
  }],
  labResults: [{
    testName: String,
    value: String,
    unit: String,
    referenceRange: String,
    date: Date,
    notes: String
  }],
  treatmentPlan: {
    description: String,
    procedures: [String],
    followUpDate: Date
  },
  notes: String
}, {
  timestamps: true
});

// Database indexes
medicalRecordSchema.index({ patientId: 1 }); // For finding records by patient
medicalRecordSchema.index({ doctorId: 1 }); // For finding records by doctor
medicalRecordSchema.index({ visitDate: -1 }); // For chronological ordering
medicalRecordSchema.index({ createdAt: -1 }); // For chronological ordering

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
