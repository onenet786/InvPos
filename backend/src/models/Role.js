const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Role = sequelize.define(
  'Role',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: {
      type: DataTypes.ENUM('admin', 'manager', 'cashier', 'inventory_staff'),
      allowNull: false,
      unique: true,
    },
    permissions: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
  },
  { tableName: 'roles' }
);

module.exports = Role;
