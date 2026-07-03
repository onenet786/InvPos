const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const auth = require('../middleware/auth');
const { checkRole } = require('../middleware/rbac');

router.use(auth);

router.get('/', productController.list);
router.get('/search', productController.search);
router.get('/low-stock', productController.getLowStock);
router.get('/:id', productController.getById);
router.post('/', checkRole(['admin', 'manager', 'inventory_staff']), productController.create);
router.put('/:id', checkRole(['admin', 'manager', 'inventory_staff']), productController.update);
router.delete('/:id', checkRole(['admin', 'manager']), productController.deactivate);
router.post('/:id/barcode', checkRole(['admin', 'manager', 'inventory_staff']), productController.generateBarcode);

module.exports = router;
