const express = require('express');
const router = express.Router();
const saleController = require('../controllers/saleController');
const auth = require('../middleware/auth');
const { checkRole } = require('../middleware/rbac');

router.use(auth);

router.get('/', saleController.list);
router.get('/:id', saleController.getById);
router.post('/', saleController.create);
router.post('/hold', saleController.hold);
router.post('/:id/resume', saleController.resume);
router.post('/:id/return', checkRole(['admin', 'manager', 'cashier']), saleController.processReturn);

module.exports = router;
