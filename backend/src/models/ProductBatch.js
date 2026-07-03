const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProductBatch = sequelize.define(
  'ProductBatch',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    productId: { type: DataTypes.INTEGER, allowNull: false, field: 'product_id' },
    batchNo: { type: DataTypes.STRING(100), allowNull: false, field: 'batch_no' },
    expiryDate: { type: DataTypes.DATEONLY, field: 'expiry_date' },
    quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    receivedDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'received_date' },
  },
  { tableName: 'product_batches' }
);

module.exports = ProductBatch;
