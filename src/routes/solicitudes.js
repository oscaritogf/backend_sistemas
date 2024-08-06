const express = require('express');
const router = express.Router();
const solicitudesController = require('../Controllers/solicitudesController/solicitudesController');

// Rutas para estudiantes
router.post('/', solicitudesController.crearNuevaSolicitud);
router.get('/estudiantes/:id_estudiante', solicitudesController.obtenerSolicitudesDeEstudiante);

// Rutas para coordinadores
router.get('/coordinadores/:id_coordinador', solicitudesController.obtenerSolicitudesPendientesParaCoordinador);
router.put('/:id_solicitud/responder', solicitudesController.responderASolicitud);

module.exports = router;