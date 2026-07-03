const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const auth = require('../middleware/auth');
const { checkRole } = require('../middleware/rbac');

router.use(auth);

router.get('/', supplierController.list);
router.post('/', checkRole(['admin', 'manager', 'inventory_staff']), supplierController.create);
router.put('/:id', checkRole(['admin', 'manager', 'inventory_staff']), supplierController.update);

module.exports = router;
