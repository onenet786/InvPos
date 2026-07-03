const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Branch = sequelize.define(
  'Branch',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(200), allowNull: false },
    code: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    address: { type: DataTypes.TEXT },
    phone: { type: DataTypes.STRING(20) },
    email: { type: DataTypes.STRING(255) },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: 'is_active' },
    isHeadquarters: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: 'is_headquarters' },
  },
  { tableName: 'branches' }
);

module.exports = Branch;
