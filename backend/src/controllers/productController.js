const { Product, Category, Stock, ProductBatch, SaleItem, Sale } = require('../models');
const { logAudit } = require('../middleware/auditLog');
const { asyncHandler } = require('../middleware/errorHandler');
const { generateBarcode } = require('../utils/generators');
const { Op } = require('sequelize');
const { sequelize } = require('../models');

exports.list = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const offset = (page - 1) * limit;
  const { search, categoryId, isActive } = req.query;

  const where = {};
  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { sku: { [Op.iLike]: `%${search}%` } },
      { barcode: { [Op.iLike]: `%${search}%` } },
    ];
  }
  if (categoryId) where.categoryId = categoryId;
  if (isActive !== undefined) where.isActive = isActive === 'true';

  const { count, rows } = await Product.findAndCountAll({
    where,
    limit,
    offset,
    include: [
      { model: Category, as: 'Category' },
      { model: Stock, as: 'Stock' },
    ],
    order: [['name', 'ASC']],
    distinct: true,
  });

  res.json({
    data: rows,
    pagination: {
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      pageSize: limit,
    },
  });
});

exports.search = asyncHandler(async (req, res) => {
  const { q, barcode } = req.query;
  const where = { isActive: true };

  if (barcode) {
    where.barcode = barcode;
  } else if (q) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${q}%` } },
      { sku: { [Op.iLike]: `%${q}%` } },
      { barcode: { [Op.iLike]: `%${q}%` } },
    ];
  }

  const products = await Product.findAll({
    where,
    include: [{ model: Stock, as: 'Stock' }],
    limit: 20,
  });

  res.json({ data: products });
});

exports.getById = asyncHandler(async (req, res) => {
  const product = await Product.findByPk(req.params.id, {
    include: [
      { model: Category, as: 'Category' },
      { model: Stock, as: 'Stock' },
      { model: ProductBatch, as: 'ProductBatches' },
    ],
  });
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json({ product });
});

exports.create = asyncHandler(async (req, res) => {
  const {
    sku,
    barcode,
    name,
    description,
    categoryId,
    unit,
    costPrice,
    salePrice,
    taxRate,
    reorderThreshold,
    hasBatchTracking,
  } = req.body;

  if (!sku || !name) return res.status(400).json({ error: 'SKU and name are required' });

  const existing = await Product.findOne({ where: { sku } });
  if (existing) return res.status(409).json({ error: 'SKU already exists' });

  const finalBarcode = barcode || generateBarcode(sku);

  const product = await Product.create({
    sku,
    barcode: finalBarcode,
    name,
    description,
    categoryId,
    unit,
    costPrice,
    salePrice,
    taxRate,
    reorderThreshold,
    hasBatchTracking,
  });

  await logAudit(req, 'create', 'product', product.id, null, req.body);
  res.status(201).json({ product });
});

exports.update = asyncHandler(async (req, res) => {
  const product = await Product.findByPk(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const oldValues = product.toJSON();
  await product.update(req.body);
  await logAudit(req, 'update', 'product', product.id, oldValues, req.body);
  res.json({ product });
});

exports.deactivate = asyncHandler(async (req, res) => {
  const product = await Product.findByPk(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const oldValues = product.toJSON();
  await product.update({ isActive: false });
  await logAudit(req, 'deactivate', 'product', product.id, oldValues, { isActive: false });
  res.json({ message: 'Product deactivated' });
});

exports.getLowStock = asyncHandler(async (req, res) => {
  const branchId = req.query.branchId || (req.branch && req.branch.id);

  const where = {};
  if (branchId) where.branchId = branchId;

  const lowStockItems = await Stock.findAll({
    where,
    include: [
      {
        model: Product,
        as: 'Product',
        where: { isActive: true },
      },
    ],
    having: require('sequelize').literal('quantity <= "Product"."reorder_threshold"'),
    group: ['Stock.id', 'Product.id'],
  });

  const filtered = lowStockItems.filter(
    (s) => s.quantity <= s.Product.reorderThreshold
  );

  res.json({ data: filtered });
});

exports.generateBarcode = asyncHandler(async (req, res) => {
  const product = await Product.findByPk(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const barcode = generateBarcode(product.sku);
  const oldValues = product.toJSON();
  await product.update({ barcode });
  await logAudit(req, 'generate_barcode', 'product', product.id, oldValues, { barcode });

  res.json({ barcode });
});

exports.topSelling = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 15;
  const branchId = req.query.branchId || (req.branch && req.branch.id);

  const saleWhere = {
    status: { [Op.in]: ['completed', 'partially_returned'] },
  };
  if (branchId) saleWhere.branchId = branchId;

  const results = await SaleItem.findAll({
    attributes: [
      'productId',
      [sequelize.fn('SUM', sequelize.col('SaleItem.quantity')), 'totalSold'],
    ],
    include: [
      {
        model: Sale,
        as: 'Sale',
        where: saleWhere,
        attributes: [],
      },
      {
        model: Product,
        as: 'Product',
        attributes: ['id', 'name', 'sku', 'barcode', 'salePrice', 'costPrice', 'taxRate'],
        include: [{ model: Stock, as: 'Stock' }],
      },
    ],
    group: ['SaleItem.productId', 'Product.id', 'Product->Stock.id'],
    order: [[sequelize.literal('"totalSold"'), 'DESC']],
    limit,
    raw: false,
  });

  const data = results.map((r) => ({
    ...r.Product.toJSON(),
    totalSold: parseInt(r.dataValues.totalSold, 10),
  }));

  res.json({ data });
});
