const { Category } = require('../models');
const { logAudit } = require('../middleware/auditLog');
const { asyncHandler } = require('../middleware/errorHandler');

exports.list = asyncHandler(async (req, res) => {
  const categories = await Category.findAll({
    include: [{ model: Category, as: 'children', include: [{ model: Category, as: 'children' }] }],
    where: { parentId: null },
    order: [['name', 'ASC']],
  });
  res.json({ data: categories });
});

exports.create = asyncHandler(async (req, res) => {
  const { name, parentId, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  const category = await Category.create({ name, parentId, description });
  await logAudit(req, 'create', 'category', category.id, null, req.body);
  res.status(201).json({ category });
});

exports.update = asyncHandler(async (req, res) => {
  const category = await Category.findByPk(req.params.id);
  if (!category) return res.status(404).json({ error: 'Category not found' });

  const oldValues = category.toJSON();
  await category.update(req.body);
  await logAudit(req, 'update', 'category', category.id, oldValues, req.body);
  res.json({ category });
});

exports.delete = asyncHandler(async (req, res) => {
  const category = await Category.findByPk(req.params.id);
  if (!category) return res.status(404).json({ error: 'Category not found' });

  const oldValues = category.toJSON();
  await category.update({ isActive: false });
  await logAudit(req, 'deactivate', 'category', category.id, oldValues, { isActive: false });
  res.json({ message: 'Category deactivated' });
});
