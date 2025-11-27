const express = require('express');
const { body, validationResult } = require('express-validator');
const Appointment = require('../models/Appointment');
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const { logAuditEvent } = require('../utils/auditLogger');

const router = express.Router();

// All routes require authentication
router.use(protect);

// @desc    Get all appointments (filtered by user role)
// @route   GET /api/appointments
// @access  Private (Doctor/Nurse/Admin: all, Receptionist: limited)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, date, doctorId, patientId } = req.query;
    const skip = (page - 1) * limit;

    let query = {};

    // Add filters
    if (status) query.status = status;
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.appointmentDate = { $gte: startDate, $lt: endDate };
    }
    if (doctorId) query.doctorId = doctorId;
    if (patientId) query.patientId = patientId;

    // Role-based filtering
    if (req.user.role === 'doctor') {
      query.doctorId = req.user._id; // Doctors see only their appointments
    } else if (req.user.role === 'receptionist') {
      // Receptionists can see all active appointments
      query.status = { $in: ['scheduled', 'confirmed', 'in-progress'] };
    }
    // Admin and nurses see all

    const appointments = await Appointment.find(query)
      .populate('patientId', 'firstName lastName age gender')
      .populate('doctorId', 'firstName lastName specialization')
      .populate('createdById', 'firstName lastName')
      .sort({ appointmentDate: -1, startTime: -1 })
      .skip(skip)
      .limit(limit)
      .lean(); // Use lean for read operations

    const total = await Appointment.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        appointments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting appointments'
    });
  }
});

// Specific routes MUST come before parameterized routes

// @desc    Get available doctors for scheduling
// @route   GET /api/appointments/doctors
// @access  Private
router.get('/doctors', async (req, res) => {
  try {
    const doctors = await User.find({
      role: 'doctor',
      isActive: true
    })
      .select('firstName lastName specialization phone')
      .sort('firstName');

    res.status(200).json({
      success: true,
      data: { doctors }
    });

  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting doctors'
    });
  }
});

// @desc    Get doctor's availability for a specific date
// @route   GET /api/appointments/availability/:doctorId
// @access  Private
router.get('/availability/:doctorId', async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required'
      });
    }

    const availability = await Appointment.getDoctorAvailability(req.params.doctorId, new Date(date));

    res.status(200).json({
      success: true,
      data: availability
    });

  } catch (error) {
    console.error('Get availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting availability'
    });
  }
});

// @desc    Get patient's appointment history
// @route   GET /api/appointments/patient/:patientId
// @access  Private
router.get('/patient/:patientId', async (req, res) => {
  try {
    const appointments = await Appointment.find({
      patientId: req.params.patientId
    })
      .populate('doctorId', 'firstName lastName specialization')
      .populate('createdById', 'firstName lastName')
      .sort({ appointmentDate: -1 });

    res.status(200).json({
      success: true,
      data: { appointments }
    });

  } catch (error) {
    console.error('Get patient appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting patient appointments'
    });
  }
});

// @desc    Get doctor's schedule for a date
// @route   GET /api/appointments/schedule/:doctorId
// @access  Private
router.get('/schedule/:doctorId', async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      const appointments = await Appointment.find({
        doctorId: req.params.doctorId,
        appointmentDate: { $gte: today, $lt: tomorrow },
        status: { $in: ['scheduled', 'confirmed', 'in-progress'] }
      })
        .populate('patientId', 'firstName lastName age')
        .sort('startTime');

      return res.status(200).json({
        success: true,
        data: {
          date: today.toISOString().split('T')[0],
          appointments
        }
      });
    }

    const appointments = await Appointment.find({
      doctorId: req.params.doctorId,
      appointmentDate: new Date(date),
      status: { $in: ['scheduled', 'confirmed', 'in-progress'] }
    })
      .populate('patientId', 'firstName lastName age')
      .sort('startTime');

    res.status(200).json({
      success: true,
      data: {
        date,
        appointments
      }
    });

  } catch (error) {
    console.error('Get schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting schedule'
    });
  }
});

// Parameterized routes come LAST

// @desc    Get single appointment by ID
// @route   GET /api/appointments/:id
// @access  Private (Role-based access)
router.get('/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patientId', 'firstName lastName age gender diagnosis')
      .populate('doctorId', 'firstName lastName specialization')
      .populate('createdById', 'firstName lastName')
      .populate('followUpForRecordId', 'diagnosis.primary visitDate');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check if user has access to this appointment
    if (req.user.role === 'doctor' && appointment.doctorId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.status(200).json({
      success: true,
      data: { appointment }
    });

  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting appointment'
    });
  }
});

// @desc    Create new appointment
// @route   POST /api/appointments
// @access  Private
router.post('/', [
  body('patientId').isMongoId().withMessage('Valid patient ID is required'),
  body('doctorId').isMongoId().withMessage('Valid doctor ID is required'),
  body('appointmentDate').isISO8601().withMessage('Valid date is required'),
  body('startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid start time (HH:MM) is required'),
  body('endTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid end time (HH:MM) is required'),
  body('reason').trim().isLength({ min: 5, max: 500 }).withMessage('Reason must be 5-500 characters'),
  body('priority').optional().isIn(['routine', 'urgent', 'emergency']).withMessage('Invalid priority')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { patientId, doctorId, appointmentDate, startTime, endTime, reason, priority, notes } = req.body;

    // Verify doctor exists and is actually a doctor
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(400).json({
        success: false,
        message: 'Invalid doctor selected'
      });
    }

    // Calculate duration
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    const durationMinutes = endMinutes - startMinutes;

    if (durationMinutes <= 0) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time'
      });
    }

    // Create appointment object
    const appointment = new Appointment({
      patientId,
      doctorId,
      createdById: req.user._id,
      appointmentDate: new Date(appointmentDate),
      startTime,
      endTime,
      durationMinutes,
      reason,
      priority: priority || 'routine',
      notes
    });

    // Check for conflicts
    const hasConflicts = await appointment.conflictsWith();
    if (hasConflicts) {
      return res.status(409).json({
        success: false,
        message: 'This time slot is already booked. Please select a different time.'
      });
    }

    await appointment.save();

    await logAuditEvent(req, {
      action: "APPOINTMENT_CREATE",
      targetType: "appointment",
      targetId: appointment._id,
      meta: {
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        after: appointment.toObject(),
      },
    });

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patientId', 'firstName lastName age gender')
      .populate('doctorId', 'firstName lastName specialization')
      .populate('createdById', 'firstName lastName');

    res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      data: { appointment: populatedAppointment }
    });

  } catch (error) {
    console.error('Create appointment error:', error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'This time slot is already booked. Please select a different time.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error creating appointment'
    });
  }
});

// @desc    Update appointment
// @route   PUT /api/appointments/:id
// @access  Private (Role-based)
router.put('/:id', [
  body('appointmentDate').optional().isISO8601().withMessage('Valid date is required'),
  body('startTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid start time (HH:MM) is required'),
  body('endTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid end time (HH:MM) is required'),
  body('reason').optional().trim().isLength({ min: 5, max: 500 }).withMessage('Reason must be 5-500 characters'),
  body('priority').optional().isIn(['routine', 'urgent', 'emergency']).withMessage('Invalid priority'),
  body('status').optional().isIn(['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show']).withMessage('Invalid status')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check permissions
    if (req.user.role === 'doctor' && appointment.doctorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const updates = req.body;

    // If time changed, recalculate duration and check conflicts
    if (updates.startTime || updates.endTime) {
      const startTime = updates.startTime || appointment.startTime;
      const endTime = updates.endTime || appointment.endTime;

      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);
      const startMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;

      updates.durationMinutes = endMinutes - startMinutes;

      if (updates.durationMinutes <= 0) {
        return res.status(400).json({
          success: false,
          message: 'End time must be after start time'
        });
      }

      // Check for conflicts with new time
      const tempAppointment = new Appointment({
        doctorId: appointment.doctorId,
        appointmentDate: appointment.appointmentDate,
        startTime,
        endTime,
        status: appointment.status
      });

      const hasConflicts = await tempAppointment.conflictsWith(appointment._id);
      if (hasConflicts) {
        return res.status(409).json({
          success: false,
          message: 'This time slot is already booked. Please select a different time.'
        });
      }
    }

    const before = appointment.toObject();
    Object.assign(appointment, updates);
    await appointment.save();

    await logAuditEvent(req, {
      action: "APPOINTMENT_UPDATE",
      targetType: "appointment",
      targetId: appointment._id,
      meta: {
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        before,
        after: appointment.toObject(),
      },
    });

    const updatedAppointment = await Appointment.findById(appointment._id)
      .populate('patientId', 'firstName lastName age gender')
      .populate('doctorId', 'firstName lastName specialization')
      .populate('createdById', 'firstName lastName');

    res.status(200).json({
      success: true,
      message: 'Appointment updated successfully',
      data: { appointment: updatedAppointment }
    });

  } catch (error) {
    console.error('Update appointment error:', error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'This time slot is already booked'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error updating appointment'
    });
  }
});

// @desc    Cancel/Delete appointment
// @route   DELETE /api/appointments/:id
// @access  Private (Role-based)
router.delete('/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check permissions
    if (req.user.role === 'doctor' && appointment.doctorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Soft delete by changing status instead of actual delete
    const before = appointment.toObject();
    appointment.status = 'cancelled';
    await appointment.save();

    await logAuditEvent(req, {
      action: "APPOINTMENT_CANCEL",
      targetType: "appointment",
      targetId: appointment._id,
      meta: {
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        before,
        after: appointment.toObject(),
      },
    });

    res.status(200).json({
      success: true,
      message: 'Appointment cancelled successfully'
    });

  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error cancelling appointment'
    });
  }
});

module.exports = router;
