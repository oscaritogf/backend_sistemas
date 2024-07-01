const express = require('express');
const router = express.Router();
const departmentHeadController = require('../Controllers/departmentHeadController');
const { authenticateToken } = require('../middleware/auth');
const { checkRole } = require('../middleware/roleCheck');

router.get('/data', authenticateToken, checkRole('jefe_departamento'), departmentHeadController.getData);

module.exports = router;