const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PurchaseOrderItem = sequelize.define(
  'PurchaseOrderItem',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    purchaseOrderId: { type: DataTypes.INTEGER, allowNull: false, field: 'purchase_order_id' },
    productId: { type: DataTypes.INTEGER, allowNull: false, field: 'product_id' },
    quantityOrdered: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: 'quantity_ordered' },
    quantityReceived: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: 'quantity_received' },
    unitCost: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0, field: 'unit_cost' },
    taxRate: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0, field: 'tax_rate' },
    total: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
  },
  { tableName: 'purchase_order_items' }
);

module.exports = PurchaseOrderItem;
