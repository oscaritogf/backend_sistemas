const express = require('express');
const router = express.Router();
const authController = require('../Controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { checkRole } = require('../middleware/roleCheck');

router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/update-password', authenticateToken, authController.updatePassword);

module.exports = router;