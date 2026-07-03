const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Customer = sequelize.define(
  'Customer',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(200), allowNull: false },
    email: { type: DataTypes.STRING(255) },
    phone: { type: DataTypes.STRING(20) },
    address: { type: DataTypes.TEXT },
    loyaltyPoints: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: 'loyalty_points' },
    creditBalance: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0, field: 'credit_balance' },
    dateOfBirth: { type: DataTypes.DATEONLY, field: 'date_of_birth' },
    notes: { type: DataTypes.TEXT },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: 'is_active' },
  },
  { tableName: 'customers' }
);

module.exports = Customer;
