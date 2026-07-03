const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PurchaseOrder = sequelize.define(
  'PurchaseOrder',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    poNumber: { type: DataTypes.STRING(50), allowNull: false, unique: true, field: 'po_number' },
    supplierId: { type: DataTypes.INTEGER, allowNull: false, field: 'supplier_id' },
    branchId: { type: DataTypes.INTEGER, allowNull: false, field: 'branch_id' },
    status: {
      type: DataTypes.ENUM('draft', 'pending', 'approved', 'partially_received', 'received', 'cancelled'),
      allowNull: false,
      defaultValue: 'draft',
    },
    subtotal: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
    tax: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
    total: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
    notes: { type: DataTypes.TEXT },
    orderDate: { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW, field: 'order_date' },
    expectedDate: { type: DataTypes.DATEONLY, field: 'expected_date' },
    receivedDate: { type: DataTypes.DATE, field: 'received_date' },
    createdBy: { type: DataTypes.INTEGER, allowNull: false, field: 'created_by' },
    approvedBy: { type: DataTypes.INTEGER, field: 'approved_by' },
  },
  { tableName: 'purchase_orders' }
);

module.exports = PurchaseOrder;
