const express = require('express');
const router = express.Router();
const matriculaController= require('../Controllers/matriculaController/matriculaController');
router.get('/departamentos', matriculaController.getDepartamentos);
router.get('/departamentos/:id_Departamento/asignaturas', matriculaController.getAsignaturasByDepartamento);
router.get('/asignaturas/:codigo/secciones', matriculaController.getSeccionesByAsignatura);


router.get('/estudiantes/:id_estudiante/asignaturas', matriculaController.getAsignaturasEstudiante);
router.post('/matricular', matriculaController.matricular);

module.exports = router;