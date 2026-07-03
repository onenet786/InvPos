const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const auth = require('../middleware/auth');
const { checkRole } = require('../middleware/rbac');

router.use(auth);

router.get('/', categoryController.list);
router.post('/', checkRole(['admin', 'manager', 'inventory_staff']), categoryController.create);
router.put('/:id', checkRole(['admin', 'manager', 'inventory_staff']), categoryController.update);
router.delete('/:id', checkRole(['admin', 'manager']), categoryController.delete);

module.exports = router;
