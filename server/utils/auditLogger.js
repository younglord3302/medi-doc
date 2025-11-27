const AuditLog = require("../models/AuditLog");

// Extract client IP in a proxy-friendly way
function getClientIp(req) {
  const xfwd = req.headers["x-forwarded-for"];
  if (xfwd && typeof xfwd === "string") {
    return xfwd.split(",")[0].trim();
  }
  return req.ip || req.connection?.remoteAddress || null;
}

// Sanitize objects before logging (optional)
// For now we allow full snapshot, but you can strip sensitive fields here.
function sanitizeSnapshot(obj) {
  if (!obj) return null;

  // Example: avoid logging raw passwords or tokens if they ever appear
  const { password, refreshToken, ...safe } = obj;

  return safe;
}

/**
 * Generic audit logger.
 *
 * @param {Request} req - Express request (to get user, IP, UA)
 * @param {Object} details
 * @param {string} details.action - e.g. "PATIENT_UPDATE"
 * @param {string} details.targetType - "patient" | "record" | "appointment" | "auth" | "system"
 * @param {string|ObjectId} [details.targetId]
 * @param {Object} [details.meta] - { before, after, ... }
 */
async function logAuditEvent(req, details) {
  try {
    const user = req.user || null; // assuming auth middleware attaches req.user
    const userId = user?._id || user?.id || null;

    const doc = {
      userId,
      action: details.action,
      targetType: details.targetType,
      targetId: details.targetId ?? null,
      meta: details.meta
        ? {
            ...details.meta,
            ...(details.meta.before
              ? { before: sanitizeSnapshot(details.meta.before) }
              : {}),
            ...(details.meta.after
              ? { after: sanitizeSnapshot(details.meta.after) }
              : {}),
          }
        : {},
      ipAddress: getClientIp(req),
      userAgent: req.headers["user-agent"] || null,
    };

    await AuditLog.create(doc);
  } catch (err) {
    // Don't break main flow if logging fails – just report to console/log system
    console.error("Audit logging failed:", err.message);
  }
}

module.exports = {
  logAuditEvent,
};
