const express = require('express');
const router = express.Router();
const purchaseOrderController = require('../controllers/purchaseOrderController');
const auth = require('../middleware/auth');
const { checkRole } = require('../middleware/rbac');

router.use(auth);

router.get('/', checkRole(['admin', 'manager', 'inventory_staff']), purchaseOrderController.list);
router.get('/:id', checkRole(['admin', 'manager', 'inventory_staff']), purchaseOrderController.getById);
router.post('/', checkRole(['admin', 'manager', 'inventory_staff']), purchaseOrderController.create);
router.put('/:id', checkRole(['admin', 'manager', 'inventory_staff']), purchaseOrderController.update);
router.post('/:id/submit', checkRole(['admin', 'manager', 'inventory_staff']), purchaseOrderController.submit);
router.post('/:id/approve', checkRole(['admin', 'manager']), purchaseOrderController.approve);
router.post('/:id/cancel', checkRole(['admin', 'manager']), purchaseOrderController.cancel);
router.post('/:id/receive', checkRole(['admin', 'manager', 'inventory_staff']), purchaseOrderController.receive);

module.exports = router;
