const { Sale, SaleItem, Product, Stock, Payment, User, Branch } = require('../models');
const { sequelize } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');
const { Op } = require('sequelize');
const ExcelJS = require('exceljs');

function getDateRange(period, dateFrom, dateTo) {
  const now = new Date();
  let start, end;

  if (dateFrom && dateTo) {
    start = new Date(dateFrom);
    end = new Date(dateTo + 'T23:59:59');
  } else if (period === 'daily') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    end = now;
  } else if (period === 'weekly') {
    start = new Date(now);
    start.setDate(now.getDate() - 7);
    end = now;
  } else if (period === 'monthly') {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = now;
  } else {
    start = new Date(now.getFullYear(), 0, 1);
    end = now;
  }

  return { start, end };
}

exports.salesReport = asyncHandler(async (req, res) => {
  const { period, dateFrom, dateTo, branchId } = req.query;
  const { start, end } = getDateRange(period, dateFrom, dateTo);

  const where = {
    status: { [Op.in]: ['completed', 'partially_returned'] },
    saleDate: { [Op.gte]: start, [Op.lte]: end },
  };

  const effectiveBranchId = branchId || (req.branch && req.branch.id);
  if (effectiveBranchId) where.branchId = effectiveBranchId;

  const sales = await Sale.findAll({
    where,
    include: [
      { model: SaleItem, as: 'items' },
      { model: Payment, as: 'payments' },
      { model: User, as: 'cashier' },
    ],
    order: [['saleDate', 'DESC']],
  });

  const summary = {
    totalSales: sales.length,
    totalRevenue: sales.reduce((sum, s) => sum + parseFloat(s.total), 0),
    totalSubtotal: sales.reduce((sum, s) => sum + parseFloat(s.subtotal), 0),
    totalDiscount: sales.reduce((sum, s) => sum + parseFloat(s.discount), 0),
    totalTax: sales.reduce((sum, s) => sum + parseFloat(s.tax), 0),
    totalPaid: sales.reduce((sum, s) => sum + parseFloat(s.paidAmount), 0),
    avgSaleValue: sales.length > 0 ? sales.reduce((sum, s) => sum + parseFloat(s.total), 0) / sales.length : 0,
    paymentBreakdown: {
      cash: 0,
      card: 0,
      mobile_wallet: 0,
      credit: 0,
    },
  };

  sales.forEach((sale) => {
    sale.payments.forEach((p) => {
      summary.paymentBreakdown[p.method] += parseFloat(p.amount);
    });
  });

  res.json({ period: { start, end }, summary, sales });
});

exports.profitReport = asyncHandler(async (req, res) => {
  const { period, dateFrom, dateTo, branchId } = req.query;
  const { start, end } = getDateRange(period, dateFrom, dateTo);

  const where = {
    saleDate: { [Op.gte]: start, [Op.lte]: end },
  };
  where.status = { [Op.in]: ['completed', 'partially_returned'] };

  const effectiveBranchId = branchId || (req.branch && req.branch.id);
  if (effectiveBranchId) where.branchId = effectiveBranchId;

  const saleItems = await SaleItem.findAll({
    include: [
      {
        model: Sale,
        as: 'Sale',
        where,
      },
      { model: Product, as: 'Product' },
    ],
  });

  const productProfit = {};
  let totalRevenue = 0;
  let totalCost = 0;
  let totalProfit = 0;

  saleItems.forEach((item) => {
    const revenue = parseFloat(item.total);
    const cost = parseFloat(item.costPrice) * item.quantity;
    const profit = revenue - cost - parseFloat(item.tax);
    const productId = item.productId;

    if (!productProfit[productId]) {
      productProfit[productId] = {
        productId,
        productName: item.Product.name,
        sku: item.Product.sku,
        quantitySold: 0,
        revenue: 0,
        cost: 0,
        profit: 0,
        margin: 0,
      };
    }

    productProfit[productId].quantitySold += item.quantity;
    productProfit[productId].revenue += revenue;
    productProfit[productId].cost += cost;
    productProfit[productId].profit += profit;

    totalRevenue += revenue;
    totalCost += cost;
    totalProfit += profit;
  });

  const products = Object.values(productProfit).map((p) => ({
    ...p,
    margin: p.revenue > 0 ? (p.profit / p.revenue) * 100 : 0,
  }));

  products.sort((a, b) => b.profit - a.profit);

  res.json({
    period: { start, end },
    summary: {
      totalRevenue,
      totalCost,
      totalProfit,
      overallMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
    },
    products,
  });
});

exports.stockValuation = asyncHandler(async (req, res) => {
  const branchId = req.query.branchId || (req.branch && req.branch.id);
  const where = {};
  if (branchId) where.branchId = branchId;

  const stockItems = await Stock.findAll({
    where,
    include: [{ model: Product, as: 'Product', where: { isActive: true } }],
  });

  let totalValue = 0;
  let totalRetailValue = 0;
  const items = stockItems.map((s) => {
    const costValue = parseFloat(s.Product.costPrice) * s.quantity;
    const retailValue = parseFloat(s.Product.salePrice) * s.quantity;
    totalValue += costValue;
    totalRetailValue += retailValue;
    return {
      productId: s.productId,
      productName: s.Product.name,
      sku: s.Product.sku,
      quantity: s.quantity,
      costPrice: parseFloat(s.Product.costPrice),
      salePrice: parseFloat(s.Product.salePrice),
      costValue,
      retailValue,
      potentialProfit: retailValue - costValue,
    };
  });

  items.sort((a, b) => b.costValue - a.costValue);

  res.json({
    summary: {
      totalItems: items.length,
      totalUnits: items.reduce((s, i) => s + i.quantity, 0),
      totalCostValue: totalValue,
      totalRetailValue: totalRetailValue,
      potentialProfit: totalRetailValue - totalValue,
    },
    items,
  });
});

exports.bestSelling = asyncHandler(async (req, res) => {
  const { period, dateFrom, dateTo, limit } = req.query;
  const { start, end } = getDateRange(period, dateFrom, dateTo);

  const saleItems = await SaleItem.findAll({
    include: [
      {
        model: Sale,
        as: 'Sale',
        where: {
          saleDate: { [Op.gte]: start, [Op.lte]: end },
          status: { [Op.in]: ['completed', 'partially_returned'] },
        },
      },
      { model: Product, as: 'Product' },
    ],
  });

  const productSales = {};
  saleItems.forEach((item) => {
    if (!productSales[item.productId]) {
      productSales[item.productId] = {
        productId: item.productId,
        productName: item.Product.name,
        sku: item.Product.sku,
        quantitySold: 0,
        revenue: 0,
      };
    }
    productSales[item.productId].quantitySold += item.quantity;
    productSales[item.productId].revenue += parseFloat(item.total);
  });

  const sorted = Object.values(productSales)
    .sort((a, b) => b.quantitySold - a.quantitySold)
    .slice(0, parseInt(limit, 10) || 20);

  res.json({ period: { start, end }, data: sorted });
});

exports.slowMoving = asyncHandler(async (req, res) => {
  const { period, dateFrom, dateTo, limit } = req.query;
  const { start, end } = getDateRange(period, dateFrom, dateTo);

  const soldProductIds = await SaleItem.findAll({
    include: [
      {
        model: Sale,
        as: 'Sale',
        where: {
          saleDate: { [Op.gte]: start, [Op.lte]: end },
          status: { [Op.in]: ['completed', 'partially_returned'] },
        },
      },
    ],
    attributes: ['productId'],
    group: ['SaleItem.productId'],
  });

  const soldIds = soldProductIds.map((s) => s.productId);

  const products = await Product.findAll({
    where: {
      isActive: true,
      id: { [Op.notIn]: soldIds.length ? soldIds : [0] },
    },
    include: [{ model: Stock, as: 'Stock' }],
  });

  const slowMoving = products
    .map((p) => ({
      productId: p.id,
      productName: p.name,
      sku: p.sku,
      stockQuantity: p.Stock.reduce((sum, s) => sum + s.quantity, 0),
      stockValue: p.Stock.reduce((sum, s) => sum + s.quantity * parseFloat(p.costPrice), 0),
    }))
    .sort((a, b) => b.stockValue - a.stockValue)
    .slice(0, parseInt(limit, 10) || 20);

  res.json({ period: { start, end }, data: slowMoving });
});

exports.cashierReport = asyncHandler(async (req, res) => {
  const { period, dateFrom, dateTo, cashierId } = req.query;
  const { start, end } = getDateRange(period, dateFrom, dateTo);

  const where = {
    saleDate: { [Op.gte]: start, [Op.lte]: end },
    status: { [Op.in]: ['completed', 'partially_returned'] },
  };
  if (cashierId) where.cashierId = cashierId;

  const sales = await Sale.findAll({
    where,
    include: [{ model: User, as: 'cashier' }, { model: Payment, as: 'payments' }],
  });

  const cashierStats = {};
  sales.forEach((sale) => {
    const cid = sale.cashierId;
    if (!cashierStats[cid]) {
      cashierStats[cid] = {
        cashierId: cid,
        cashierName: sale.cashier ? `${sale.cashier.firstName || ''} ${sale.cashier.lastName || ''}`.trim() : 'Unknown',
        username: sale.cashier ? sale.cashier.username : 'unknown',
        totalSales: 0,
        totalRevenue: 0,
        totalItems: 0,
        paymentBreakdown: { cash: 0, card: 0, mobile_wallet: 0, credit: 0 },
      };
    }
    cashierStats[cid].totalSales += 1;
    cashierStats[cid].totalRevenue += parseFloat(sale.total);
    sale.payments.forEach((p) => {
      cashierStats[cid].paymentBreakdown[p.method] += parseFloat(p.amount);
    });
  });

  const data = Object.values(cashierStats).sort((a, b) => b.totalRevenue - a.totalRevenue);

  res.json({ period: { start, end }, data });
});

exports.exportReport = asyncHandler(async (req, res) => {
  const { type = 'sales', period, dateFrom, dateTo, branchId } = req.query;
  const { start, end } = getDateRange(period, dateFrom, dateTo);

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Report');

  worksheet.columns = [
    { header: 'Sale Number', key: 'saleNumber', width: 20 },
    { header: 'Date', key: 'saleDate', width: 20 },
    { header: 'Cashier', key: 'cashier', width: 20 },
    { header: 'Subtotal', key: 'subtotal', width: 12 },
    { header: 'Discount', key: 'discount', width: 12 },
    { header: 'Tax', key: 'tax', width: 12 },
    { header: 'Total', key: 'total', width: 12 },
    { header: 'Status', key: 'status', width: 15 },
  ];

  worksheet.getRow(1).font = { bold: true };

  const where = {
    saleDate: { [Op.gte]: start, [Op.lte]: end },
  };

  const effectiveBranchId = branchId || (req.branch && req.branch.id);
  if (effectiveBranchId) where.branchId = effectiveBranchId;

  const sales = await Sale.findAll({
    where,
    include: [{ model: User, as: 'cashier' }],
    order: [['saleDate', 'DESC']],
  });

  sales.forEach((sale) => {
    worksheet.addRow({
      saleNumber: sale.saleNumber,
      saleDate: sale.saleDate.toISOString().slice(0, 19),
      cashier: sale.cashier ? sale.cashier.username : '',
      subtotal: parseFloat(sale.subtotal),
      discount: parseFloat(sale.discount),
      tax: parseFloat(sale.tax),
      total: parseFloat(sale.total),
      status: sale.status,
    });
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=${type}_report_${Date.now()}.xlsx`);

  await workbook.xlsx.write(res);
  res.end();
});
