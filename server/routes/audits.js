const express = require('express');
const AuditLog = require('../models/AuditLog');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleMiddleware');

const router = express.Router();

// All audit log routes require authentication and admin role
router.use(protect);
router.use(requireRole("admin"));

/**
 * GET /api/audits
 * Query params:
 *  - userId
 *  - targetType
 *  - targetId
 *  - action
 *  - from (ISO date)
 *  - to   (ISO date)
 *  - page (default 1)
 *  - limit (default 20)
 */
router.get('/', async (req, res) => {
  try {
    const {
      userId,
      targetType,
      targetId,
      action,
      from,
      to,
      page = 1,
      limit = 20,
    } = req.query;

    const query = {};

    if (userId) query.userId = userId;
    if (targetType) query.targetType = targetType;
    if (targetId) query.targetId = targetId;
    if (action) query.action = action;

    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    const [items, total] = await Promise.all([
      AuditLog.find(query)
        .populate("userId", "firstName lastName email role")
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      AuditLog.countDocuments(query),
    ]);

    res.json({
      data: items,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving audit logs'
    });
  }
});

// Optional: logs for a specific patient
router.get('/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    const query = { targetType: "patient", targetId: patientId };

    const [items, total] = await Promise.all([
      AuditLog.find(query)
        .populate("userId", "firstName lastName email role")
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      AuditLog.countDocuments(query),
    ]);

    res.json({
      data: items,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get patient audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving patient audit logs'
    });
  }
});

module.exports = router;
