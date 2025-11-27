const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // system actions may not have a user
    },
    action: {
      type: String,
      required: true, // e.g. "PATIENT_UPDATE", "LOGIN", "RECORD_DELETE"
      trim: true,
    },
    targetType: {
      type: String,
      enum: ["patient", "record", "appointment", "auth", "system"],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.Mixed, // ObjectId or string
      required: false,
    },
    meta: {
      type: mongoose.Schema.Types.Mixed, // arbitrary JSON: { before, after, fields }
      default: {},
    },
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Database indexes for efficient audit log queries
auditLogSchema.index({ targetType: 1, targetId: 1, createdAt: -1 }); // Compound index for target filtering
auditLogSchema.index({ userId: 1, createdAt: -1 }); // For user activity logs
auditLogSchema.index({ action: 1, createdAt: -1 }); // For action-based filtering
auditLogSchema.index({ createdAt: -1 }); // For chronological ordering

module.exports = mongoose.model("AuditLog", auditLogSchema);
