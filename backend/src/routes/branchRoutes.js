const express = require('express');
const router = express.Router();
const branchController = require('../controllers/branchController');
const auth = require('../middleware/auth');
const { checkRole } = require('../middleware/rbac');

router.use(auth);

router.get('/', branchController.list);
router.post('/', checkRole(['admin', 'manager']), branchController.create);
router.put('/:id', checkRole(['admin', 'manager']), branchController.update);

module.exports = router;
