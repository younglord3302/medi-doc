const express = require('express');
const MedicalRecord = require('../models/MedicalRecord');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleMiddleware');
const { logAuditEvent } = require('../utils/auditLogger');
const router = express.Router();

// Protect all medical record routes - sensitive PHI data
router.use(protect);
router.use(requireRole("admin", "doctor", "nurse"));

// GET all medical records with pagination
router.get('/', async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);

    const [records, total] = await Promise.all([
      MedicalRecord.find()
        .populate('patientId', 'firstName lastName') // Only select needed fields for performance
        .sort({ visitDate: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(), // Use lean for read operations
      MedicalRecord.countDocuments({})
    ]);

    res.json({
      data: records,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: (page * limit) < total
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching medical records', error: error.message });
  }
});

// GET medical record by ID
router.get('/:id', async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.id)
      .populate('patientId', 'firstName lastName');
    if (!record) return res.status(404).json({ message: 'Medical record not found' });
    res.json(record);
  } catch (error) {
    res.status(400).json({ message: 'Invalid ID', error: error.message });
  }
});

// GET medical records for a specific patient with pagination
router.get('/patient/:patientId', async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50); // Smaller limit for patient records

    const query = { patientId: req.params.patientId };

    const [records, total] = await Promise.all([
      MedicalRecord.find(query)
        .populate('patientId', 'firstName lastName')
        .sort({ visitDate: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(), // Use lean for read operations
      MedicalRecord.countDocuments(query)
    ]);

    res.json({
      data: records,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: (page * limit) < total
      }
    });
  } catch (error) {
    res.status(400).json({ message: 'Error fetching patient records', error: error.message });
  }
});

// CREATE new medical record
router.post('/', async (req, res) => {
  try {
    const recordData = {
      ...req.body,
      doctorId: req.user._id // Use authenticated user
    };

    const record = await MedicalRecord.create(recordData);
    const populatedRecord = await MedicalRecord.findById(record._id)
      .populate('patientId', 'firstName lastName');

    await logAuditEvent(req, {
      action: "RECORD_CREATE",
      targetType: "record",
      targetId: record._id,
      meta: {
        patientId: record.patientId,
        doctorId: record.doctorId,
        after: record.toObject(),
      },
    });

    res.status(201).json(populatedRecord);
  } catch (error) {
    res.status(400).json({ message: 'Error creating medical record', error: error.message });
  }
});

// UPDATE medical record
router.put('/:id', async (req, res) => {
  try {
    const existing = await MedicalRecord.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: 'Medical record not found' });
    }

    const before = existing.toObject();

    const record = await MedicalRecord.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('patientId', 'firstName lastName');

    await logAuditEvent(req, {
      action: "RECORD_UPDATE",
      targetType: "record",
      targetId: record._id,
      meta: {
        patientId: record.patientId,
        doctorId: record.doctorId,
        before,
        after: record.toObject(),
      },
    });

    res.json(record);
  } catch (error) {
    res.status(400).json({ message: 'Error updating medical record', error: error.message });
  }
});

// DELETE medical record
router.delete('/:id', async (req, res) => {
  try {
    const existing = await MedicalRecord.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: 'Medical record not found' });
    }

    const before = existing.toObject();
    await existing.deleteOne();

    await logAuditEvent(req, {
      action: "RECORD_DELETE",
      targetType: "record",
      targetId: existing._id,
      meta: {
        patientId: existing.patientId,
        doctorId: existing.doctorId,
        before,
      },
    });

    res.json({ message: 'Medical record deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: 'Error deleting medical record', error: error.message });
  }
});

module.exports = router;
