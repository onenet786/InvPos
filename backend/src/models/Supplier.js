const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Supplier = sequelize.define(
  'Supplier',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(200), allowNull: false },
    contactPerson: { type: DataTypes.STRING(100), field: 'contact_person' },
    email: { type: DataTypes.STRING(255) },
    phone: { type: DataTypes.STRING(20) },
    address: { type: DataTypes.TEXT },
    paymentTerms: { type: DataTypes.STRING(255), field: 'payment_terms' },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: 'is_active' },
  },
  { tableName: 'suppliers' }
);

module.exports = Supplier;
