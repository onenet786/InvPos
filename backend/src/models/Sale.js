const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Sale = sequelize.define(
  'Sale',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    saleNumber: { type: DataTypes.STRING(50), allowNull: false, unique: true, field: 'sale_number' },
    branchId: { type: DataTypes.INTEGER, allowNull: false, field: 'branch_id' },
    cashierId: { type: DataTypes.INTEGER, allowNull: false, field: 'cashier_id' },
    customerId: { type: DataTypes.INTEGER, field: 'customer_id' },
    status: {
      type: DataTypes.ENUM('completed', 'held', 'cancelled', 'returned', 'partially_returned'),
      allowNull: false,
      defaultValue: 'completed',
    },
    subtotal: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
    discount: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
    discountType: { type: DataTypes.STRING(20), defaultValue: 'amount', field: 'discount_type' },
    tax: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
    total: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
    paidAmount: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0, field: 'paid_amount' },
    changeAmount: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0, field: 'change_amount' },
    notes: { type: DataTypes.TEXT },
    heldAt: { type: DataTypes.DATE, field: 'held_at' },
    resumedAt: { type: DataTypes.DATE, field: 'resumed_at' },
    saleDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'sale_date' },
  },
  { tableName: 'sales' }
);

module.exports = Sale;
