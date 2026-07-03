const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const auth = require('../middleware/auth');
const { checkRole } = require('../middleware/rbac');

router.use(auth);

router.get('/', settingsController.get);
router.put('/', checkRole(['admin']), settingsController.update);

module.exports = router;
