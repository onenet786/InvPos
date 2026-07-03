const {
  PurchaseOrder,
  PurchaseOrderItem,
  Product,
  Supplier,
  Branch,
  GoodsReceivedNote,
  Stock,
  StockAdjustment,
} = require('../models');
const { sequelize } = require('../models');
const { logAudit } = require('../middleware/auditLog');
const { asyncHandler } = require('../middleware/errorHandler');
const { generatePONumber, generateGRNNumber } = require('../utils/generators');
const { Op } = require('sequelize');

exports.list = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const offset = (page - 1) * limit;
  const { status, supplierId } = req.query;

  const where = {};
  if (status) where.status = status;
  if (supplierId) where.supplierId = supplierId;

  const { count, rows } = await PurchaseOrder.findAndCountAll({
    where,
    limit,
    offset,
    include: [
      { model: Supplier, as: 'Supplier' },
      { model: Branch, as: 'Branch' },
      { model: PurchaseOrderItem, as: 'items', include: [{ model: Product, as: 'Product' }] },
    ],
    order: [['created_at', 'DESC']],
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
  const po = await PurchaseOrder.findByPk(req.params.id, {
    include: [
      { model: Supplier, as: 'Supplier' },
      { model: Branch, as: 'Branch' },
      { model: PurchaseOrderItem, as: 'items', include: [{ model: Product, as: 'Product' }] },
      { model: GoodsReceivedNote, as: 'grns' },
    ],
  });
  if (!po) return res.status(404).json({ error: 'Purchase order not found' });
  res.json({ purchaseOrder: po });
});

exports.create = asyncHandler(async (req, res) => {
  const { supplierId, branchId, items, notes, expectedDate } = req.body;

  if (!supplierId || !branchId || !items || !items.length) {
    return res.status(400).json({ error: 'supplierId, branchId, and items are required' });
  }

  const poNumber = generatePONumber();
  let subtotal = 0;
  let tax = 0;

  const t = await sequelize.transaction();

  try {
    const po = await PurchaseOrder.create(
      {
        poNumber,
        supplierId,
        branchId,
        status: 'draft',
        notes,
        expectedDate,
        createdBy: req.user.id,
      },
      { transaction: t }
    );

    for (const item of items) {
      const product = await Product.findByPk(item.productId, { transaction: t });
      if (!product) {
        await t.rollback();
        return res.status(400).json({ error: `Product ${item.productId} not found` });
      }

      const itemTotal = item.quantityOrdered * item.unitCost;
      const itemTax = itemTotal * (item.taxRate || product.taxRate || 0) / 100;

      await PurchaseOrderItem.create(
        {
          purchaseOrderId: po.id,
          productId: item.productId,
          quantityOrdered: item.quantityOrdered,
          quantityReceived: 0,
          unitCost: item.unitCost,
          taxRate: item.taxRate || product.taxRate || 0,
          total: itemTotal + itemTax,
        },
        { transaction: t }
      );

      subtotal += itemTotal;
      tax += itemTax;
    }

    await po.update({ subtotal, tax, total: subtotal + tax }, { transaction: t });

    await t.commit();
    await logAudit(req, 'create', 'purchase_order', po.id, null, req.body);

    const fullPo = await PurchaseOrder.findByPk(po.id, {
      include: [
        { model: Supplier, as: 'Supplier' },
        { model: PurchaseOrderItem, as: 'items', include: [{ model: Product, as: 'Product' }] },
      ],
    });

    res.status(201).json({ purchaseOrder: fullPo });
  } catch (err) {
    await t.rollback();
    throw err;
  }
});

exports.update = asyncHandler(async (req, res) => {
  const po = await PurchaseOrder.findByPk(req.params.id);
  if (!po) return res.status(404).json({ error: 'Purchase order not found' });
  if (!['draft', 'pending'].includes(po.status)) {
    return res.status(400).json({ error: 'Cannot edit PO that is already approved or received' });
  }

  const oldValues = po.toJSON();
  await po.update(req.body);
  await logAudit(req, 'update', 'purchase_order', po.id, oldValues, req.body);
  res.json({ purchaseOrder: po });
});

exports.submit = asyncHandler(async (req, res) => {
  const po = await PurchaseOrder.findByPk(req.params.id);
  if (!po) return res.status(404).json({ error: 'Purchase order not found' });
  if (po.status !== 'draft') return res.status(400).json({ error: 'Only draft POs can be submitted' });

  await po.update({ status: 'pending' });
  await logAudit(req, 'submit', 'purchase_order', po.id, { status: 'draft' }, { status: 'pending' });
  res.json({ purchaseOrder: po });
});

exports.approve = asyncHandler(async (req, res) => {
  const po = await PurchaseOrder.findByPk(req.params.id);
  if (!po) return res.status(404).json({ error: 'Purchase order not found' });
  if (po.status !== 'pending') return res.status(400).json({ error: 'Only pending POs can be approved' });

  await po.update({ status: 'approved', approvedBy: req.user.id });
  await logAudit(req, 'approve', 'purchase_order', po.id, { status: 'pending' }, { status: 'approved' });
  res.json({ purchaseOrder: po });
});

exports.cancel = asyncHandler(async (req, res) => {
  const po = await PurchaseOrder.findByPk(req.params.id);
  if (!po) return res.status(404).json({ error: 'Purchase order not found' });
  if (['received', 'cancelled'].includes(po.status)) {
    return res.status(400).json({ error: 'Cannot cancel received or already cancelled PO' });
  }

  await po.update({ status: 'cancelled' });
  await logAudit(req, 'cancel', 'purchase_order', po.id, null, { status: 'cancelled' });
  res.json({ purchaseOrder: po });
});

exports.receive = asyncHandler(async (req, res) => {
  const { receivedItems, notes } = req.body;
  const po = await PurchaseOrder.findByPk(req.params.id, {
    include: [{ model: PurchaseOrderItem, as: 'items' }],
  });

  if (!po) return res.status(404).json({ error: 'Purchase order not found' });
  if (!['approved', 'partially_received'].includes(po.status)) {
    return res.status(400).json({ error: 'PO must be approved before receiving' });
  }

  const t = await sequelize.transaction();

  try {
    const grnNumber = generateGRNNumber();

    const grn = await GoodsReceivedNote.create(
      {
        grnNumber,
        purchaseOrderId: po.id,
        receivedBy: req.user.id,
        notes,
      },
      { transaction: t }
    );

    let allReceived = true;

    for (const received of receivedItems) {
      const poItem = po.items.find((i) => i.id === received.poItemId);
      if (!poItem) {
        await t.rollback();
        return res.status(400).json({ error: `PO item ${received.poItemId} not found` });
      }

      const newQtyReceived = poItem.quantityReceived + received.quantity;
      if (newQtyReceived > poItem.quantityOrdered) {
        await t.rollback();
        return res.status(400).json({
          error: `Received quantity exceeds ordered for product ${poItem.productId}`,
        });
      }

      await poItem.update({ quantityReceived: newQtyReceived }, { transaction: t });

      if (newQtyReceived < poItem.quantityOrdered) {
        allReceived = false;
      }

      let [stock] = await Stock.findOrCreate({
        where: { productId: poItem.productId, branchId: po.branchId },
        defaults: { productId: poItem.productId, branchId: po.branchId, quantity: 0 },
        transaction: t,
      });

      await stock.update({ quantity: stock.quantity + received.quantity }, { transaction: t });

      await StockAdjustment.create(
        {
          productId: poItem.productId,
          branchId: po.branchId,
          type: 'initial_stock',
          quantity: received.quantity,
          reason: `GRN ${grnNumber}`,
          reference: grnNumber,
          adjustedBy: req.user.id,
        },
        { transaction: t }
      );
    }

    const newStatus = allReceived ? 'received' : 'partially_received';
    await po.update(
      { status: newStatus, receivedDate: allReceived ? new Date() : null },
      { transaction: t }
    );

    await t.commit();
    await logAudit(req, 'receive', 'purchase_order', po.id, null, { grnNumber, receivedItems });

    res.json({ purchaseOrder: po, grn });
  } catch (err) {
    await t.rollback();
    throw err;
  }
});
