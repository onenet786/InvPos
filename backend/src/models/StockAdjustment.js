const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StockAdjustment = sequelize.define(
  'StockAdjustment',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    productId: { type: DataTypes.INTEGER, allowNull: false, field: 'product_id' },
    branchId: { type: DataTypes.INTEGER, allowNull: false, field: 'branch_id' },
    type: {
      type: DataTypes.ENUM('damage', 'loss', 'return', 'initial_stock', 'transfer_in', 'transfer_out', 'correction'),
      allowNull: false,
    },
    quantity: { type: DataTypes.INTEGER, allowNull: false },
    reason: { type: DataTypes.TEXT },
    reference: { type: DataTypes.STRING(255) },
    adjustedBy: { type: DataTypes.INTEGER, allowNull: false, field: 'adjusted_by' },
    adjustmentDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'adjustment_date' },
  },
  { tableName: 'stock_adjustments' }
);

module.exports = StockAdjustment;
