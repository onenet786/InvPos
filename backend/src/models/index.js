const sequelize = require('../config/database');

const Role = require('./Role');
const User = require('./User');
const Branch = require('./Branch');
const Category = require('./Category');
const Product = require('./Product');
const ProductBatch = require('./ProductBatch');
const Stock = require('./Stock');
const Supplier = require('./Supplier');
const PurchaseOrder = require('./PurchaseOrder');
const PurchaseOrderItem = require('./PurchaseOrderItem');
const GoodsReceivedNote = require('./GoodsReceivedNote');
const Sale = require('./Sale');
const SaleItem = require('./SaleItem');
const Payment = require('./Payment');
const Customer = require('./Customer');
const StockAdjustment = require('./StockAdjustment');
const { StockTransfer, StockTransferItem } = require('./StockTransfer');
const AuditLog = require('./AuditLog');
const { SaleReturn, SaleReturnItem } = require('./SaleReturn');
const { PurchaseReturn, PurchaseReturnItem } = require('./PurchaseReturn');

// --- Associations ---

// Role <-> User
Role.hasMany(User, { foreignKey: 'role_id' });
User.belongsTo(Role, { foreignKey: 'role_id' });

// Branch <-> User
Branch.hasMany(User, { foreignKey: 'branch_id' });
User.belongsTo(Branch, { foreignKey: 'branch_id' });

// Category self-reference
Category.hasMany(Category, { foreignKey: 'parent_id', as: 'children' });
Category.belongsTo(Category, { foreignKey: 'parent_id', as: 'parent' });

// Category <-> Product
Category.hasMany(Product, { foreignKey: 'category_id' });
Product.belongsTo(Category, { foreignKey: 'category_id' });

// Product <-> ProductBatch
Product.hasMany(ProductBatch, { foreignKey: 'product_id' });
ProductBatch.belongsTo(Product, { foreignKey: 'product_id' });

// Product <-> Stock
Product.hasMany(Stock, { foreignKey: 'product_id' });
Stock.belongsTo(Product, { foreignKey: 'product_id' });

// Branch <-> Stock
Branch.hasMany(Stock, { foreignKey: 'branch_id' });
Stock.belongsTo(Branch, { foreignKey: 'branch_id' });

// Supplier <-> PurchaseOrder
Supplier.hasMany(PurchaseOrder, { foreignKey: 'supplier_id' });
PurchaseOrder.belongsTo(Supplier, { foreignKey: 'supplier_id' });

// Branch <-> PurchaseOrder
Branch.hasMany(PurchaseOrder, { foreignKey: 'branch_id' });
PurchaseOrder.belongsTo(Branch, { foreignKey: 'branch_id' });

// User <-> PurchaseOrder (created_by, approved_by)
User.hasMany(PurchaseOrder, { foreignKey: 'created_by', as: 'createdPurchaseOrders' });
PurchaseOrder.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
User.hasMany(PurchaseOrder, { foreignKey: 'approved_by', as: 'approvedPurchaseOrders' });
PurchaseOrder.belongsTo(User, { foreignKey: 'approved_by', as: 'approver' });

// PurchaseOrder <-> PurchaseOrderItem
PurchaseOrder.hasMany(PurchaseOrderItem, { foreignKey: 'purchase_order_id', as: 'items' });
PurchaseOrderItem.belongsTo(PurchaseOrder, { foreignKey: 'purchase_order_id' });

// Product <-> PurchaseOrderItem
Product.hasMany(PurchaseOrderItem, { foreignKey: 'product_id' });
PurchaseOrderItem.belongsTo(Product, { foreignKey: 'product_id' });

// PurchaseOrder <-> GoodsReceivedNote
PurchaseOrder.hasMany(GoodsReceivedNote, { foreignKey: 'purchase_order_id', as: 'grns' });
GoodsReceivedNote.belongsTo(PurchaseOrder, { foreignKey: 'purchase_order_id' });

// Branch <-> Sale
Branch.hasMany(Sale, { foreignKey: 'branch_id' });
Sale.belongsTo(Branch, { foreignKey: 'branch_id' });

// User (cashier) <-> Sale
User.hasMany(Sale, { foreignKey: 'cashier_id', as: 'sales' });
Sale.belongsTo(User, { foreignKey: 'cashier_id', as: 'cashier' });

// Customer <-> Sale
Customer.hasMany(Sale, { foreignKey: 'customer_id' });
Sale.belongsTo(Customer, { foreignKey: 'customer_id' });

// Sale <-> SaleItem
Sale.hasMany(SaleItem, { foreignKey: 'sale_id', as: 'items' });
SaleItem.belongsTo(Sale, { foreignKey: 'sale_id' });

// Product <-> SaleItem
Product.hasMany(SaleItem, { foreignKey: 'product_id' });
SaleItem.belongsTo(Product, { foreignKey: 'product_id' });

// Sale <-> Payment
Sale.hasMany(Payment, { foreignKey: 'sale_id', as: 'payments' });
Payment.belongsTo(Sale, { foreignKey: 'sale_id' });

// Product <-> StockAdjustment
Product.hasMany(StockAdjustment, { foreignKey: 'product_id' });
StockAdjustment.belongsTo(Product, { foreignKey: 'product_id' });

// Branch <-> StockAdjustment
Branch.hasMany(StockAdjustment, { foreignKey: 'branch_id' });
StockAdjustment.belongsTo(Branch, { foreignKey: 'branch_id' });

// User <-> StockAdjustment
User.hasMany(StockAdjustment, { foreignKey: 'adjusted_by' });
StockAdjustment.belongsTo(User, { foreignKey: 'adjusted_by', as: 'adjuster' });

// StockTransfer associations
Branch.hasMany(StockTransfer, { foreignKey: 'from_branch_id', as: 'outgoingTransfers' });
Branch.hasMany(StockTransfer, { foreignKey: 'to_branch_id', as: 'incomingTransfers' });
StockTransfer.belongsTo(Branch, { foreignKey: 'from_branch_id', as: 'fromBranch' });
StockTransfer.belongsTo(Branch, { foreignKey: 'to_branch_id', as: 'toBranch' });
StockTransfer.hasMany(StockTransferItem, { foreignKey: 'stock_transfer_id', as: 'items' });
StockTransferItem.belongsTo(StockTransfer, { foreignKey: 'stock_transfer_id' });
StockTransferItem.belongsTo(Product, { foreignKey: 'product_id' });

// SaleReturn associations
Sale.hasMany(SaleReturn, { foreignKey: 'original_sale_id', as: 'returns' });
SaleReturn.belongsTo(Sale, { foreignKey: 'original_sale_id', as: 'originalSale' });
SaleReturn.hasMany(SaleReturnItem, { foreignKey: 'sale_return_id', as: 'items' });
SaleReturnItem.belongsTo(SaleReturn, { foreignKey: 'sale_return_id' });
SaleReturnItem.belongsTo(SaleItem, { foreignKey: 'sale_item_id' });
SaleReturnItem.belongsTo(Product, { foreignKey: 'product_id' });

// PurchaseReturn associations
PurchaseOrder.hasMany(PurchaseReturn, { foreignKey: 'purchase_order_id', as: 'returns' });
PurchaseReturn.belongsTo(PurchaseOrder, { foreignKey: 'purchase_order_id' });
PurchaseReturn.hasMany(PurchaseReturnItem, { foreignKey: 'purchase_return_id', as: 'items' });
PurchaseReturnItem.belongsTo(PurchaseReturn, { foreignKey: 'purchase_return_id' });
PurchaseReturnItem.belongsTo(Product, { foreignKey: 'product_id' });

// AuditLog <-> User
User.hasMany(AuditLog, { foreignKey: 'user_id' });
AuditLog.belongsTo(User, { foreignKey: 'user_id' });

module.exports = {
  sequelize,
  Role,
  User,
  Branch,
  Category,
  Product,
  ProductBatch,
  Stock,
  Supplier,
  PurchaseOrder,
  PurchaseOrderItem,
  GoodsReceivedNote,
  Sale,
  SaleItem,
  Payment,
  Customer,
  StockAdjustment,
  StockTransfer,
  StockTransferItem,
  AuditLog,
  SaleReturn,
  SaleReturnItem,
  PurchaseReturn,
  PurchaseReturnItem,
};
