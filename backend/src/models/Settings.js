const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Settings = sequelize.define(
  'Settings',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    companyName: { type: DataTypes.STRING(200), allowNull: false, defaultValue: 'My Company', field: 'company_name' },
    companyLogo: { type: DataTypes.STRING(500), field: 'company_logo' },
    address: { type: DataTypes.TEXT },
    phone: { type: DataTypes.STRING(50) },
    email: { type: DataTypes.STRING(255) },
    website: { type: DataTypes.STRING(255) },
    taxId: { type: DataTypes.STRING(100), field: 'tax_id' },
    currencySymbol: { type: DataTypes.STRING(10), allowNull: false, defaultValue: '$', field: 'currency_symbol' },
    currencyCode: { type: DataTypes.STRING(10), allowNull: false, defaultValue: 'USD', field: 'currency_code' },
    receiptFooter: { type: DataTypes.TEXT, field: 'receipt_footer' },
    receiptHeader: { type: DataTypes.TEXT, field: 'receipt_header' },
    lowStockThreshold: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 10, field: 'low_stock_threshold' },
    taxEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: 'tax_enabled' },
    defaultTaxRate: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0, field: 'default_tax_rate' },
    loyaltyEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: 'loyalty_enabled' },
    loyaltyPointsPerDollar: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 1, field: 'loyalty_points_per_dollar' },
  },
  { tableName: 'settings' }
);

module.exports = Settings;
