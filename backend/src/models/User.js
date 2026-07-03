const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define(
  'User',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    roleId: { type: DataTypes.INTEGER, allowNull: false, field: 'role_id' },
    branchId: { type: DataTypes.INTEGER, field: 'branch_id' },
    username: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    passwordHash: { type: DataTypes.STRING(255), allowNull: false, field: 'password_hash' },
    firstName: { type: DataTypes.STRING(100), field: 'first_name' },
    lastName: { type: DataTypes.STRING(100), field: 'last_name' },
    phone: { type: DataTypes.STRING(20) },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: 'is_active' },
    lastLogin: { type: DataTypes.DATE, field: 'last_login' },
    passwordResetToken: { type: DataTypes.STRING(255), field: 'password_reset_token' },
    passwordResetExpires: { type: DataTypes.DATE, field: 'password_reset_expires' },
  },
  {
    tableName: 'users',
    defaultScope: {
      attributes: { exclude: ['passwordHash', 'passwordResetToken', 'passwordResetExpires'] },
    },
    scopes: {
      withPassword: {
        attributes: { include: ['passwordHash'] },
      },
    },
  }
);

module.exports = User;
