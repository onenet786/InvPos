const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SaleReturn = sequelize.define(
  'SaleReturn',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    returnNumber: { type: DataTypes.STRING(50), allowNull: false, unique: true, field: 'return_number' },
    originalSaleId: { type: DataTypes.INTEGER, allowNull: false, field: 'original_sale_id' },
    branchId: { type: DataTypes.INTEGER, allowNull: false, field: 'branch_id' },
    processedBy: { type: DataTypes.INTEGER, allowNull: false, field: 'processed_by' },
    total: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
    refundMethod: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'cash', field: 'refund_method' },
    reason: { type: DataTypes.TEXT },
    returnDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'return_date' },
  },
  { tableName: 'sale_returns' }
);

const SaleReturnItem = sequelize.define(
  'SaleReturnItem',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    saleReturnId: { type: DataTypes.INTEGER, allowNull: false, field: 'sale_return_id' },
    saleItemId: { type: DataTypes.INTEGER, allowNull: false, field: 'sale_item_id' },
    productId: { type: DataTypes.INTEGER, allowNull: false, field: 'product_id' },
    quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    unitPrice: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0, field: 'unit_price' },
    total: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
  },
  { tableName: 'sale_return_items' }
);

module.exports = { SaleReturn, SaleReturnItem };
