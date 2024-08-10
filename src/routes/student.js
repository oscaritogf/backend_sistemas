const express = require('express');
const router = express.Router();
const studentController = require('../Controllers/studentController');
const { authenticateToken } = require('../middleware/auth');
const { checkRole } = require('../middleware/roleCheck');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const certifcacioController = require('../Controllers/estudiante/certificacionController')

router.get('/data', authenticateToken, checkRole('estudiante'), studentController.getData);
router.put('/perfil/:id_Usuario', upload.fields([{ name: 'Fotografia1' }, { name: 'Fotografia2' }, { name: 'Fotografia3' }]), studentController.updateProfile);
router.get('/perfil/:id_Usuario', studentController.getProfile);
router.put('/:numeroCuenta',upload.single('Imagen'), studentController.updateEstudiante);

router.post('/enviarSolicitud', studentController.enviarSolicitud);
// router.post('/aceptarSolicitud', studentController.aceptarSolicitud);

router.get('/aceptarSolicitud', studentController.aceptarSolicitud);
router.get('/usuarios', studentController.getAllUsers);

router.post('/encuesta', studentController.enviarEncuesta);


///Enpoindt de certificacion de notas y indices
router.get('/certificacion/:id_estudiante', certifcacioController.getCertificacion);

router.get('/indice-global/:id_estudiante', certifcacioController.getIndiceGlobal);
router.get('/indice-periodo/:id_estudiante', certifcacioController.getIndicePorPeriodo);

module.exports = router;