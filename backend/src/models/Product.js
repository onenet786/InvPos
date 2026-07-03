const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define(
  'Product',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    sku: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    barcode: { type: DataTypes.STRING(100), unique: true },
    name: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT },
    categoryId: { type: DataTypes.INTEGER, field: 'category_id' },
    unit: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'piece' },
    costPrice: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0, field: 'cost_price' },
    salePrice: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0, field: 'sale_price' },
    taxRate: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0, field: 'tax_rate' },
    reorderThreshold: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 10, field: 'reorder_threshold' },
    hasBatchTracking: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: 'has_batch_tracking' },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: 'is_active' },
    isHotItem: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: 'is_hot_item' },
    hotItemOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: 'hot_item_order' },
    imageUrl: { type: DataTypes.STRING(500), field: 'image_url' },
  },
  { tableName: 'products' }
);

module.exports = Product;
