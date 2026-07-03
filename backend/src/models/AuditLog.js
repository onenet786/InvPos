const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AuditLog = sequelize.define(
  'AuditLog',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, field: 'user_id' },
    action: { type: DataTypes.STRING(50), allowNull: false },
    entityType: { type: DataTypes.STRING(50), allowNull: false, field: 'entity_type' },
    entityId: { type: DataTypes.INTEGER, field: 'entity_id' },
    oldValues: { type: DataTypes.JSONB, field: 'old_values' },
    newValues: { type: DataTypes.JSONB, field: 'new_values' },
    ipAddress: { type: DataTypes.STRING(45), field: 'ip_address' },
    userAgent: { type: DataTypes.TEXT, field: 'user_agent' },
  },
  { tableName: 'audit_logs', updatedAt: false }
);

module.exports = AuditLog;
