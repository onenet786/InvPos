const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const auth = require('../middleware/auth');
const { checkRole } = require('../middleware/rbac');

router.use(auth);

router.get('/sales', reportController.salesReport);
router.get('/profit', checkRole(['admin', 'manager']), reportController.profitReport);
router.get('/stock-valuation', checkRole(['admin', 'manager', 'inventory_staff']), reportController.stockValuation);
router.get('/best-selling', reportController.bestSelling);
router.get('/slow-moving', checkRole(['admin', 'manager', 'inventory_staff']), reportController.slowMoving);
router.get('/cashier', checkRole(['admin', 'manager']), reportController.cashierReport);
router.get('/export', reportController.exportReport);

module.exports = router;
