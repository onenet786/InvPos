const { Stock, Product, Branch, StockAdjustment } = require('../models');
const { logAudit } = require('../middleware/auditLog');
const { asyncHandler } = require('../middleware/errorHandler');
const { sequelize } = require('../models');
const { Op } = require('sequelize');

exports.list = asyncHandler(async (req, res) => {
  const branchId = req.query.branchId || (req.branch && req.branch.id);
  const where = {};
  if (branchId) where.branchId = branchId;

  const stockItems = await Stock.findAll({
    where,
    include: [{ model: Product, as: 'Product' }],
    order: [['updated_at', 'DESC']],
  });

  res.json({ data: stockItems });
});

exports.getByProduct = asyncHandler(async (req, res) => {
  const stock = await Stock.findAll({
    where: { productId: req.params.productId },
    include: [{ model: Branch, as: 'Branch' }],
  });
  res.json({ data: stock });
});

exports.adjust = asyncHandler(async (req, res) => {
  const { productId, branchId, type, quantity, reason, reference } = req.body;

  if (!productId || !branchId || !type || quantity === undefined) {
    return res.status(400).json({ error: 'productId, branchId, type, and quantity are required' });
  }

  const t = await sequelize.transaction();

  try {
    let [stock] = await Stock.findOrCreate({
      where: { productId, branchId },
      defaults: { productId, branchId, quantity: 0 },
      transaction: t,
    });

    const oldQuantity = stock.quantity;
    let newQuantity = stock.quantity;

    if (['damage', 'loss', 'transfer_out'].includes(type)) {
      newQuantity -= Math.abs(quantity);
      if (newQuantity < 0) {
        await t.rollback();
        return res.status(400).json({ error: 'Insufficient stock for adjustment' });
      }
    } else {
      newQuantity += Math.abs(quantity);
    }

    await stock.update({ quantity: newQuantity }, { transaction: t });

    await StockAdjustment.create(
      {
        productId,
        branchId,
        type,
        quantity: Math.abs(quantity),
        reason,
        reference,
        adjustedBy: req.user.id,
      },
      { transaction: t }
    );

    await t.commit();

    await logAudit(req, 'stock_adjust', 'stock', stock.id, { quantity: oldQuantity }, { quantity: newQuantity });

    res.json({ message: 'Stock adjusted', oldQuantity, newQuantity });
  } catch (err) {
    await t.rollback();
    throw err;
  }
});

exports.transfer = asyncHandler(async (req, res) => {
  const { productId, fromBranchId, toBranchId, quantity, notes } = req.body;

  if (!productId || !fromBranchId || !toBranchId || !quantity) {
    return res.status(400).json({ error: 'productId, fromBranchId, toBranchId, and quantity are required' });
  }

  if (fromBranchId === toBranchId) {
    return res.status(400).json({ error: 'Cannot transfer to the same branch' });
  }

  const t = await sequelize.transaction();

  try {
    const fromStock = await Stock.findOne({
      where: { productId, branchId: fromBranchId },
      transaction: t,
    });

    if (!fromStock || fromStock.quantity < quantity) {
      await t.rollback();
      return res.status(400).json({ error: 'Insufficient stock at source branch' });
    }

    await fromStock.update({ quantity: fromStock.quantity - quantity }, { transaction: t });

    const [toStock] = await Stock.findOrCreate({
      where: { productId, branchId: toBranchId },
      defaults: { productId, branchId: toBranchId, quantity: 0 },
      transaction: t,
    });

    await toStock.update({ quantity: toStock.quantity + quantity }, { transaction: t });

    await StockAdjustment.bulkCreate(
      [
        {
          productId,
          branchId: fromBranchId,
          type: 'transfer_out',
          quantity,
          reason: notes || 'Stock transfer out',
          adjustedBy: req.user.id,
        },
        {
          productId,
          branchId: toBranchId,
          type: 'transfer_in',
          quantity,
          reason: notes || 'Stock transfer in',
          adjustedBy: req.user.id,
        },
      ],
      { transaction: t }
    );

    await t.commit();

    await logAudit(req, 'stock_transfer', 'stock', null, { fromBranchId, toBranchId, productId, quantity }, null);

    res.json({ message: 'Stock transferred successfully' });
  } catch (err) {
    await t.rollback();
    throw err;
  }
});
