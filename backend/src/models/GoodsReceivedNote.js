const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GoodsReceivedNote = sequelize.define(
  'GoodsReceivedNote',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    grnNumber: { type: DataTypes.STRING(50), allowNull: false, unique: true, field: 'grn_number' },
    purchaseOrderId: { type: DataTypes.INTEGER, allowNull: false, field: 'purchase_order_id' },
    receivedBy: { type: DataTypes.INTEGER, allowNull: false, field: 'received_by' },
    receivedDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'received_date' },
    notes: { type: DataTypes.TEXT },
  },
  { tableName: 'goods_received_notes' }
);

module.exports = GoodsReceivedNote;
