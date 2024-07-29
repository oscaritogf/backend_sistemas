const express = require('express');
const router = express.Router();
const studentController = require('../Controllers/studentController');
const { authenticateToken } = require('../middleware/auth');
const { checkRole } = require('../middleware/roleCheck');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.get('/data', authenticateToken, checkRole('estudiante'), studentController.getData);
router.put('/perfil/:id_Usuario', upload.fields([{ name: 'Fotografia1' }, { name: 'Fotografia2' }, { name: 'Fotografia3' }]), studentController.updateProfile);
router.get('/perfil/:id_Usuario', studentController.getProfile);
router.put('/:numeroCuenta',upload.single('Imagen'), studentController.updateEstudiante);

module.exports = router;