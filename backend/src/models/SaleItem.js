const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SaleItem = sequelize.define(
  'SaleItem',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    saleId: { type: DataTypes.INTEGER, allowNull: false, field: 'sale_id' },
    productId: { type: DataTypes.INTEGER, allowNull: false, field: 'product_id' },
    quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    unitPrice: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0, field: 'unit_price' },
    costPrice: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0, field: 'cost_price' },
    discount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    discountType: { type: DataTypes.STRING(20), defaultValue: 'amount', field: 'discount_type' },
    tax: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    total: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
  },
  { tableName: 'sale_items' }
);

module.exports = SaleItem;
