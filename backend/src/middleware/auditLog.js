const { AuditLog } = require('../models');

async function logAudit(req, action, entityType, entityId, oldValues = null, newValues = null) {
  try {
    await AuditLog.create({
      userId: req.user ? req.user.id : null,
      action,
      entityType,
      entityId,
      oldValues,
      newValues,
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.headers['user-agent'],
    });
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
}

module.exports = { logAudit };
