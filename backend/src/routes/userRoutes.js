const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const { checkRole } = require('../middleware/rbac');

router.use(auth);

router.get('/', checkRole(['admin', 'manager']), userController.list);
router.get('/:id', checkRole(['admin', 'manager']), userController.getById);
router.post('/', checkRole(['admin']), userController.create);
router.put('/:id', checkRole(['admin']), userController.update);
router.delete('/:id', checkRole(['admin']), userController.deactivate);
router.get('/:id/activity', checkRole(['admin', 'manager']), userController.getActivity);

module.exports = router;
