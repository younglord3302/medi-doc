const Patient = require('../models/Patient');
const { logAuditEvent } = require('../utils/auditLogger');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get all patients (with pagination)
// @route   GET /api/patients
// @access  Private (multiple roles)
const getPatients = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);

  const [patients, total] = await Promise.all([
    Patient.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(), // Use lean for read operations
    Patient.countDocuments({})
  ]);

  res.json({
    data: patients,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasMore: (page * limit) < total
    }
  });
});

// @desc    Get single patient
// @route   GET /api/patients/:id
// @access  Private
const getPatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id);
  if (!patient) return res.status(404).json({ message: 'Patient not found' });
  res.json(patient);
});

// @desc    Create new patient
// @route   POST /api/patients
// @access  Private
const createPatient = asyncHandler(async (req, res) => {
  const patient = await Patient.create(req.body);

  await logAuditEvent(req, {
    action: "PATIENT_CREATE",
    targetType: "patient",
    targetId: patient._id,
    meta: {
      after: patient.toObject(),
    },
  });

  res.status(201).json(patient);
});

// @desc    Update patient
// @route   PUT /api/patients/:id
// @access  Private
const updatePatient = asyncHandler(async (req, res) => {
  const existing = await Patient.findById(req.params.id);
  if (!existing) {
    return res.status(404).json({ message: 'Patient not found' });
  }

  const before = existing.toObject();
  const updated = await Patient.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  await logAuditEvent(req, {
    action: "PATIENT_UPDATE",
    targetType: "patient",
    targetId: updated._id,
    meta: {
      before,
      after: updated.toObject(),
    },
  });

  res.json(updated);
});

// @desc    Delete patient
// @route   DELETE /api/patients/:id
// @access  Private
const deletePatient = asyncHandler(async (req, res) => {
  const existing = await Patient.findById(req.params.id);
  if (!existing) {
    return res.status(404).json({ message: 'Patient not found' });
  }

  const before = existing.toObject();
  await existing.deleteOne();

  await logAuditEvent(req, {
    action: "PATIENT_DELETE",
    targetType: "patient",
    targetId: existing._id,
    meta: {
      before,
    },
  });

  res.json({ message: 'Patient deleted' });
});

module.exports = {
  getPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient,
};
