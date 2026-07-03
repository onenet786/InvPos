const { Customer, Sale } = require('../models');
const { logAudit } = require('../middleware/auditLog');
const { asyncHandler } = require('../middleware/errorHandler');

exports.list = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const offset = (page - 1) * limit;
  const { search } = req.query;

  const where = {};
  if (search) {
    const { Op } = require('sequelize');
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { phone: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } },
    ];
  }

  const { count, rows } = await Customer.findAndCountAll({
    where,
    limit,
    offset,
    order: [['name', 'ASC']],
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
  const customer = await Customer.findByPk(req.params.id);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });

  const sales = await Sale.findAll({
    where: { customerId: req.params.id, status: ['completed', 'partially_returned'] },
    order: [['sale_date', 'DESC']],
    limit: 50,
  });

  res.json({ customer, purchaseHistory: sales });
});

exports.create = asyncHandler(async (req, res) => {
  const { name, email, phone, address, dateOfBirth, notes } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  const customer = await Customer.create({ name, email, phone, address, dateOfBirth, notes });
  await logAudit(req, 'create', 'customer', customer.id, null, req.body);
  res.status(201).json({ customer });
});

exports.update = asyncHandler(async (req, res) => {
  const customer = await Customer.findByPk(req.params.id);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });

  const oldValues = customer.toJSON();
  await customer.update(req.body);
  await logAudit(req, 'update', 'customer', customer.id, oldValues, req.body);
  res.json({ customer });
});
