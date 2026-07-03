const {
  Sale,
  SaleItem,
  Payment,
  Product,
  Customer,
  Branch,
  Stock,
  StockAdjustment,
  SaleReturn,
  SaleReturnItem,
} = require('../models');
const { sequelize } = require('../models');
const { logAudit } = require('../middleware/auditLog');
const { asyncHandler } = require('../middleware/errorHandler');
const { generateSaleNumber, generateReturnNumber } = require('../utils/generators');
const { Op } = require('sequelize');

exports.list = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const offset = (page - 1) * limit;
  const { status, cashierId, branchId, dateFrom, dateTo } = req.query;

  const where = {};
  if (status) where.status = status;
  if (cashierId) where.cashierId = cashierId;

  const effectiveBranchId = branchId || (req.branch && req.branch.id);
  if (effectiveBranchId) where.branchId = effectiveBranchId;

  if (dateFrom || dateTo) {
    where.saleDate = {};
    if (dateFrom) where.saleDate[Op.gte] = new Date(dateFrom);
    if (dateTo) where.saleDate[Op.lte] = new Date(dateTo + 'T23:59:59');
  }

  const { count, rows } = await Sale.findAndCountAll({
    where,
    limit,
    offset,
    include: [
      { model: SaleItem, as: 'items', include: [{ model: Product, as: 'Product' }] },
      { model: Payment, as: 'payments' },
      { model: Customer, as: 'Customer' },
    ],
    order: [['sale_date', 'DESC']],
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

exports.getById = asyncHandler(async (req, res) => {
  const sale = await Sale.findByPk(req.params.id, {
    include: [
      { model: SaleItem, as: 'items', include: [{ model: Product, as: 'Product' }] },
      { model: Payment, as: 'payments' },
      { model: Customer, as: 'Customer' },
      { model: Branch, as: 'Branch' },
    ],
  });
  if (!sale) return res.status(404).json({ error: 'Sale not found' });
  res.json({ sale });
});

exports.create = asyncHandler(async (req, res) => {
  const {
    items,
    payments,
    customerId,
    discount,
    discountType,
    notes,
  } = req.body;

  if (!items || !items.length) {
    return res.status(400).json({ error: 'Sale items are required' });
  }

  const branchId = req.body.branchId || (req.branch && req.branch.id);
  if (!branchId) return res.status(400).json({ error: 'Branch ID is required' });

  const t = await sequelize.transaction();

  try {
    let subtotal = 0;
    let totalTax = 0;
    const saleItemsData = [];

    for (const item of items) {
      const product = await Product.findByPk(item.productId, { transaction: t });
      if (!product) {
        await t.rollback();
        return res.status(400).json({ error: `Product ${item.productId} not found` });
      }

      const stock = await Stock.findOne({
        where: { productId: item.productId, branchId },
        transaction: t,
      });

      if (!stock || stock.quantity < item.quantity) {
        await t.rollback();
        return res.status(400).json({ error: `Insufficient stock for ${product.name}` });
      }

      const unitPrice = item.unitPrice || product.salePrice;
      const itemTotal = unitPrice * item.quantity;
      const itemDiscount = item.discount || 0;
      const afterDiscount = itemTotal - itemDiscount;
      const itemTax = (afterDiscount * (product.taxRate || 0)) / 100;

      subtotal += itemTotal;
      totalTax += itemTax;

      saleItemsData.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        costPrice: product.costPrice,
        discount: itemDiscount,
        discountType: item.discountType || 'amount',
        tax: itemTax,
        total: afterDiscount + itemTax,
      });

      await stock.update({ quantity: stock.quantity - item.quantity }, { transaction: t });
    }

    const cartDiscount = discount || 0;
    const total = subtotal - cartDiscount + totalTax;

    let paidAmount = 0;
    if (payments && payments.length) {
      paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    } else {
      paidAmount = total;
    }

    const changeAmount = paidAmount - total;

    const sale = await Sale.create(
      {
        saleNumber: generateSaleNumber(),
        branchId,
        cashierId: req.user.id,
        customerId,
        status: 'completed',
        subtotal,
        discount: cartDiscount,
        discountType: discountType || 'amount',
        tax: totalTax,
        total,
        paidAmount,
        changeAmount: changeAmount > 0 ? changeAmount : 0,
        notes,
      },
      { transaction: t }
    );

    for (const sid of saleItemsData) {
      await SaleItem.create({ saleId: sale.id, ...sid }, { transaction: t });
    }

    if (payments && payments.length) {
      for (const p of payments) {
        await Payment.create(
          {
            saleId: sale.id,
            method: p.method,
            amount: p.amount,
            reference: p.reference,
            isSplit: payments.length > 1,
          },
          { transaction: t }
        );
      }
    }

    if (customerId) {
      const customer = await Customer.findByPk(customerId, { transaction: t });
      if (customer) {
        const loyaltyPoints = Math.floor(total / 10);
        await customer.update(
          { loyaltyPoints: customer.loyaltyPoints + loyaltyPoints },
          { transaction: t }
        );
      }
    }

    await t.commit();
    await logAudit(req, 'create_sale', 'sale', sale.id, null, { total, items: items.length });

    const fullSale = await Sale.findByPk(sale.id, {
      include: [
        { model: SaleItem, as: 'items', include: [{ model: Product, as: 'Product' }] },
        { model: Payment, as: 'payments' },
        { model: Customer, as: 'Customer' },
      ],
    });

    res.status(201).json({ sale: fullSale });
  } catch (err) {
    await t.rollback();
    throw err;
  }
});

exports.hold = asyncHandler(async (req, res) => {
  const { items, customerId, discount, discountType, notes } = req.body;

  if (!items || !items.length) {
    return res.status(400).json({ error: 'Sale items are required' });
  }

  const branchId = req.body.branchId || (req.branch && req.branch.id);

  const t = await sequelize.transaction();

  try {
    let subtotal = 0;
    let totalTax = 0;

    for (const item of items) {
      const product = await Product.findByPk(item.productId, { transaction: t });
      if (!product) {
        await t.rollback();
        return res.status(400).json({ error: `Product ${item.productId} not found` });
      }

      const unitPrice = item.unitPrice || product.salePrice;
      const itemTotal = unitPrice * item.quantity;
      const itemDiscount = item.discount || 0;
      const afterDiscount = itemTotal - itemDiscount;
      const itemTax = (afterDiscount * (product.taxRate || 0)) / 100;

      subtotal += itemTotal;
      totalTax += itemTax;

      const stock = await Stock.findOne({
        where: { productId: item.productId, branchId },
        transaction: t,
      });

      if (stock) {
        await stock.update(
          { reservedQuantity: stock.reservedQuantity + item.quantity },
          { transaction: t }
        );
      }
    }

    const cartDiscount = discount || 0;
    const total = subtotal - cartDiscount + totalTax;

    const sale = await Sale.create(
      {
        saleNumber: generateSaleNumber(),
        branchId,
        cashierId: req.user.id,
        customerId,
        status: 'held',
        subtotal,
        discount: cartDiscount,
        discountType: discountType || 'amount',
        tax: totalTax,
        total,
        notes,
        heldAt: new Date(),
      },
      { transaction: t }
    );

    for (const item of items) {
      const product = await Product.findByPk(item.productId, { transaction: t });
      const unitPrice = item.unitPrice || product.salePrice;
      const itemTotal = unitPrice * item.quantity;
      const itemDiscount = item.discount || 0;
      const afterDiscount = itemTotal - itemDiscount;
      const itemTax = (afterDiscount * (product.taxRate || 0)) / 100;

      await SaleItem.create(
        {
          saleId: sale.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice,
          costPrice: product.costPrice,
          discount: itemDiscount,
          discountType: item.discountType || 'amount',
          tax: itemTax,
          total: afterDiscount + itemTax,
        },
        { transaction: t }
      );
    }

    await t.commit();
    await logAudit(req, 'hold_sale', 'sale', sale.id, null, null);

    res.status(201).json({ sale });
  } catch (err) {
    await t.rollback();
    throw err;
  }
});

exports.resume = asyncHandler(async (req, res) => {
  const sale = await Sale.findByPk(req.params.id, {
    include: [{ model: SaleItem, as: 'items', include: [{ model: Product, as: 'Product' }] }],
  });

  if (!sale) return res.status(404).json({ error: 'Sale not found' });
  if (sale.status !== 'held') return res.status(400).json({ error: 'Sale is not held' });

  const t = await sequelize.transaction();

  try {
    for (const item of sale.items) {
      const stock = await Stock.findOne({
        where: { productId: item.productId, branchId: sale.branchId },
        transaction: t,
      });
      if (stock) {
        await stock.update(
          { reservedQuantity: Math.max(0, stock.reservedQuantity - item.quantity) },
          { transaction: t }
        );
      }
    }

    await sale.update({ status: 'completed', resumedAt: new Date() }, { transaction: t });

    for (const item of sale.items) {
      const stock = await Stock.findOne({
        where: { productId: item.productId, branchId: sale.branchId },
        transaction: t,
      });
      if (stock) {
        await stock.update(
          { quantity: stock.quantity - item.quantity },
          { transaction: t }
        );
      }
    }

    await t.commit();
    await logAudit(req, 'resume_sale', 'sale', sale.id, { status: 'held' }, { status: 'completed' });

    res.json({ sale });
  } catch (err) {
    await t.rollback();
    throw err;
  }
});

exports.processReturn = asyncHandler(async (req, res) => {
  const { returnItems, refundMethod, reason } = req.body;

  const sale = await Sale.findByPk(req.params.id, {
    include: [{ model: SaleItem, as: 'items' }],
  });

  if (!sale) return res.status(404).json({ error: 'Sale not found' });
  if (!['completed', 'partially_returned'].includes(sale.status)) {
    return res.status(400).json({ error: 'Cannot return this sale' });
  }

  const t = await sequelize.transaction();

  try {
    let returnTotal = 0;
    const returnItemsData = [];

    for (const ret of returnItems) {
      const saleItem = sale.items.find((i) => i.id === ret.saleItemId);
      if (!saleItem) {
        await t.rollback();
        return res.status(400).json({ error: `Sale item ${ret.saleItemId} not found` });
      }

      if (ret.quantity > saleItem.quantity) {
        await t.rollback();
        return res.status(400).json({ error: 'Return quantity exceeds sold quantity' });
      }

      const itemTotal = saleItem.unitPrice * ret.quantity;
      returnTotal += itemTotal;

      returnItemsData.push({
        saleItemId: saleItem.id,
        productId: saleItem.productId,
        quantity: ret.quantity,
        unitPrice: saleItem.unitPrice,
        total: itemTotal,
      });

      let [stock] = await Stock.findOrCreate({
        where: { productId: saleItem.productId, branchId: sale.branchId },
        defaults: { productId: saleItem.productId, branchId: sale.branchId, quantity: 0 },
        transaction: t,
      });

      await stock.update({ quantity: stock.quantity + ret.quantity }, { transaction: t });

      await StockAdjustment.create(
        {
          productId: saleItem.productId,
          branchId: sale.branchId,
          type: 'return',
          quantity: ret.quantity,
          reason: reason || 'Sale return',
          adjustedBy: req.user.id,
        },
        { transaction: t }
      );
    }

    const saleReturn = await SaleReturn.create(
      {
        returnNumber: generateReturnNumber('SRET'),
        originalSaleId: sale.id,
        branchId: sale.branchId,
        processedBy: req.user.id,
        total: returnTotal,
        refundMethod: refundMethod || 'cash',
        reason,
      },
      { transaction: t }
    );

    for (const rid of returnItemsData) {
      await SaleReturnItem.create({ saleReturnId: saleReturn.id, ...rid }, { transaction: t });
    }

    const newStatus = returnTotal >= sale.total ? 'returned' : 'partially_returned';
    await sale.update({ status: newStatus }, { transaction: t });

    await t.commit();
    await logAudit(req, 'sale_return', 'sale', sale.id, null, { returnTotal, returnItems });

    res.json({ saleReturn, sale });
  } catch (err) {
    await t.rollback();
    throw err;
  }
});
