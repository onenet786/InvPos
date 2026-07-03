const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');
const auth = require('../middleware/auth');
const { checkRole } = require('../middleware/rbac');

router.use(auth);

router.get('/', stockController.list);
router.get('/:productId', stockController.getByProduct);
router.post('/adjust', checkRole(['admin', 'manager', 'inventory_staff']), stockController.adjust);
router.post('/transfer', checkRole(['admin', 'manager', 'inventory_staff']), stockController.transfer);

module.exports = router;
