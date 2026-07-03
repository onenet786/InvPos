const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const auth = require('../middleware/auth');
const { checkRole } = require('../middleware/rbac');

router.use(auth);

router.get('/', customerController.list);
router.get('/:id', customerController.getById);
router.post('/', checkRole(['admin', 'manager', 'cashier']), customerController.create);
router.put('/:id', checkRole(['admin', 'manager', 'cashier']), customerController.update);

module.exports = router;
