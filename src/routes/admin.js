const express = require('express');
const router = express.Router();
const adminController = require('../Controllers/adminController');
const { authenticateToken } = require('../middleware/auth');
const { checkRole } = require('../middleware/roleCheck');

router.get('/data', authenticateToken, checkRole('admin'), adminController.getData);

module.exports = router;