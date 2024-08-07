const express = require('express');
const router = express.Router();
const authController = require('../Controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { checkRole } = require('../middleware/roleCheck');
const { auth } = require('../config/supabase');

router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/update-password', authenticateToken, authController.updatePassword);
router.post('/logout',  authenticateToken, authController.logout);
module.exports = router;