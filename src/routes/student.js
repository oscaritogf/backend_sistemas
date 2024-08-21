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
router.put('/contrasena/:numeroCuenta', studentController.changePassword);
router.get('/perfil/:id_Usuario', studentController.getProfile);
router.put('/:numeroCuenta',upload.single('Imagen'), studentController.updateEstudiante);

router.post('/enviarSolicitud', studentController.enviarSolicitud);
// router.post('/aceptarSolicitud', studentController.aceptarSolicitud);
router.get('/aceptarSolicitud', studentController.aceptarSolicitud);

router.get('/correo/:numeroCuenta', studentController.getCorreo);
router.post('/enviarCambioContrasena', studentController.enviarCambioContrasena);
router.get('/aceptarCambioContrasena/:id', studentController.aceptarCambioContrasena);
router.post('/cambioContrasena', studentController.cambioContrasenaSinValidacion);

router.get('/usuarios', studentController.getAllUsers);

//encuesta y vista de notas
router.post('/encuesta', studentController.Encuesta);
router.get('/notas/:seccion/:estudiante', studentController.getNotas);
router.get('/secciones/:numeroCuenta', studentController.getSecciones);
router.get('/verificar-encuesta/:seccion/:estudiante', studentController.verificarEncuesta);

///Enpoindt de certificacion de notas y indices
router.get('/certificacion/:id_estudiante', certifcacioController.getCertificacion);

router.get('/certificacionVOAE/:numeroCuenta', certifcacioController.getCertificacionVOAE);
router.get('/certificacionVOAE/pdf/:numeroCuenta', certifcacioController.getCertificacionVOAEpdf);

router.get('/indice-global/:id_estudiante', certifcacioController.getIndiceGlobal);
router.post('/indice-periodo/:id_estudiante/:periodo/:id_cunfigMatricula', certifcacioController.getIndicePorPeriodo);

router.put('/indice-globalu/:id_estudiante', certifcacioController.putIndiceGlobal);
router.put('/indice-periodou/:id_estudiante/:periodo', certifcacioController.putIndicePorPeriodo);

module.exports = router;