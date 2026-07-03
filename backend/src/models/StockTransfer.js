const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StockTransfer = sequelize.define(
  'StockTransfer',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    transferNumber: { type: DataTypes.STRING(50), allowNull: false, unique: true, field: 'transfer_number' },
    fromBranchId: { type: DataTypes.INTEGER, allowNull: false, field: 'from_branch_id' },
    toBranchId: { type: DataTypes.INTEGER, allowNull: false, field: 'to_branch_id' },
    status: {
      type: DataTypes.ENUM('draft', 'in_transit', 'received', 'cancelled'),
      allowNull: false,
      defaultValue: 'draft',
    },
    notes: { type: DataTypes.TEXT },
    createdBy: { type: DataTypes.INTEGER, allowNull: false, field: 'created_by' },
    receivedBy: { type: DataTypes.INTEGER, field: 'received_by' },
    transferDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'transfer_date' },
    receivedDate: { type: DataTypes.DATE, field: 'received_date' },
  },
  { tableName: 'stock_transfers' }
);

const StockTransferItem = sequelize.define(
  'StockTransferItem',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    stockTransferId: { type: DataTypes.INTEGER, allowNull: false, field: 'stock_transfer_id' },
    productId: { type: DataTypes.INTEGER, allowNull: false, field: 'product_id' },
    quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  { tableName: 'stock_transfer_items' }
);

module.exports = { StockTransfer, StockTransferItem };
