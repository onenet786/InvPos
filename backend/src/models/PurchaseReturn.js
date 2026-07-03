const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PurchaseReturn = sequelize.define(
  'PurchaseReturn',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    returnNumber: { type: DataTypes.STRING(50), allowNull: false, unique: true, field: 'return_number' },
    purchaseOrderId: { type: DataTypes.INTEGER, allowNull: false, field: 'purchase_order_id' },
    supplierId: { type: DataTypes.INTEGER, allowNull: false, field: 'supplier_id' },
    branchId: { type: DataTypes.INTEGER, allowNull: false, field: 'branch_id' },
    processedBy: { type: DataTypes.INTEGER, allowNull: false, field: 'processed_by' },
    total: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
    reason: { type: DataTypes.TEXT },
    returnDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'return_date' },
  },
  { tableName: 'purchase_returns' }
);

const PurchaseReturnItem = sequelize.define(
  'PurchaseReturnItem',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    purchaseReturnId: { type: DataTypes.INTEGER, allowNull: false, field: 'purchase_return_id' },
    productId: { type: DataTypes.INTEGER, allowNull: false, field: 'product_id' },
    quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    unitCost: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0, field: 'unit_cost' },
    total: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
  },
  { tableName: 'purchase_return_items' }
);

module.exports = { PurchaseReturn, PurchaseReturnItem };
