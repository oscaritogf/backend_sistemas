const express = require('express');
const router = express.Router();
const teacherController = require('../Controllers/teacherController');
const { authenticateToken } = require('../middleware/auth');
const { checkRole } = require('../middleware/roleCheck');

router.get('/data', authenticateToken, checkRole('docente'), teacherController.getData);

module.exports = router;