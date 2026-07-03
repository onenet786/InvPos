const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Stock = sequelize.define(
  'Stock',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    productId: { type: DataTypes.INTEGER, allowNull: false, field: 'product_id' },
    branchId: { type: DataTypes.INTEGER, allowNull: false, field: 'branch_id' },
    quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    reservedQuantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: 'reserved_quantity' },
    minStockLevel: { type: DataTypes.INTEGER, defaultValue: 0, field: 'min_stock_level' },
  },
  { tableName: 'stock' }
);

module.exports = Stock;
