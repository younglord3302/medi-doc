const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Patient = require('../models/Patient');
const MedicalRecord = require('../models/MedicalRecord');
const Appointment = require('../models/Appointment');
const { protect } = require('../middleware/auth');
const { logAuditEvent } = require('../utils/auditLogger');

const router = express.Router();

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', [
  body('firstName').trim().isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
  body('lastName').trim().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['admin', 'doctor', 'nurse', 'receptionist']).withMessage('Invalid role')
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

    const { firstName, lastName, email, password, role, specialization, phone } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password,
      role: role || 'receptionist',
      specialization: specialization || '',
      phone: phone || ''
    });

    // Create token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          specialization: user.specialization,
          phone: user.phone,
          createdAt: user.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').exists().withMessage('Password is required')
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

    const { email, password } = req.body;

    // Check for user
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      // Audit log failed login attempt - user not found
      await logAuditEvent(req, {
        action: "LOGIN_FAILED",
        targetType: "auth",
        targetId: null,
        meta: {
          email: email.toLowerCase(),
          reason: "User not found"
        },
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Check password
    if (!(await user.comparePassword(password))) {
      // Audit log failed login attempt
      await logAuditEvent(req, {
        action: "LOGIN_FAILED",
        targetType: "auth",
        targetId: null,
        meta: {
          email: email.toLowerCase(),
          reason: "Invalid password"
        },
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Create token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    // Audit log successful login
    await logAuditEvent(req, {
      action: "LOGIN_SUCCESS",
      targetType: "auth",
      targetId: user._id,
      meta: {
        email: user.email,
        role: user.role
      },
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          specialization: user.specialization,
          phone: user.phone,
          createdAt: user.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          specialization: user.specialization,
          phone: user.phone,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          isActive: user.isActive
        }
      }
    });

  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get dashboard statistics
// @route   GET /api/auth/dashboard
// @access  Private
router.get('/dashboard', protect, async (req, res) => {
  try {
    // Get current date for today's appointments
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Run all statistics queries in parallel for better performance
    const [
      totalPatients,
      totalRecords,
      todayAppointments,
      totalAppointments,
      activeUsers
    ] = await Promise.all([
      // Total patients count
      Patient.countDocuments(),

      // Total medical records count
      MedicalRecord.countDocuments(),

      // Today's appointments count
      Appointment.countDocuments({
        appointmentDate: {
          $gte: today,
          $lt: tomorrow
        }
      }),

      // Total appointments count
      Appointment.countDocuments(),

      // Active users count
      User.countDocuments({ isActive: true })
    ]);

    // Get recent activity (last 5 audit log entries)
    const recentActivity = await require('../models/AuditLog')
      .find()
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('action targetType createdAt userId meta');

    res.status(200).json({
      success: true,
      data: {
        statistics: {
          totalPatients,
          totalRecords,
          todayAppointments,
          totalAppointments,
          activeUsers
        },
        recentActivity: recentActivity.map(activity => ({
          id: activity._id,
          action: activity.action,
          targetType: activity.targetType,
          timestamp: activity.createdAt,
          user: activity.userId ? {
            name: `${activity.userId.firstName} ${activity.userId.lastName}`,
            email: activity.userId.email
          } : null,
          meta: activity.meta
        }))
      }
    });

  } catch (error) {
    console.error('Dashboard statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error loading dashboard data'
    });
  }
});

module.exports = router;
