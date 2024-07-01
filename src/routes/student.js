const express = require('express');
const router = express.Router();
const studentController = require('../Controllers/studentController');
const { authenticateToken } = require('../middleware/auth');
const { checkRole } = require('../middleware/roleCheck');

router.get('/data', authenticateToken, checkRole('estudiante'), studentController.getData);

module.exports = router;