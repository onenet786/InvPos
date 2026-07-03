const { Supplier } = require('../models');
const { logAudit } = require('../middleware/auditLog');
const { asyncHandler } = require('../middleware/errorHandler');

exports.list = asyncHandler(async (req, res) => {
  const suppliers = await Supplier.findAll({ order: [['name', 'ASC']] });
  res.json({ data: suppliers });
});

exports.create = asyncHandler(async (req, res) => {
  const { name, contactPerson, email, phone, address, paymentTerms } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  const supplier = await Supplier.create({ name, contactPerson, email, phone, address, paymentTerms });
  await logAudit(req, 'create', 'supplier', supplier.id, null, req.body);
  res.status(201).json({ supplier });
});

exports.update = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findByPk(req.params.id);
  if (!supplier) return res.status(404).json({ error: 'Supplier not found' });

  const oldValues = supplier.toJSON();
  await supplier.update(req.body);
  await logAudit(req, 'update', 'supplier', supplier.id, oldValues, req.body);
  res.json({ supplier });
});
