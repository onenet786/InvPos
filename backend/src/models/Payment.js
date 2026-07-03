const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Payment = sequelize.define(
  'Payment',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    saleId: { type: DataTypes.INTEGER, allowNull: false, field: 'sale_id' },
    method: {
      type: DataTypes.ENUM('cash', 'card', 'mobile_wallet', 'credit'),
      allowNull: false,
    },
    amount: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
    reference: { type: DataTypes.STRING(255) },
    isSplit: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: 'is_split' },
  },
  { tableName: 'payments' }
);

module.exports = Payment;
