const express = require('express');
const router = express.Router();
const coordinatorController = require('../Controllers/coordinatorController');
const { authenticateToken } = require('../middleware/auth');
const { checkRole } = require('../middleware/roleCheck');

router.get('/data', authenticateToken, checkRole('coordinador'), coordinatorController.getData);

module.exports = router;