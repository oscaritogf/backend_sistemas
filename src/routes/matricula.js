const express = require('express');
const router = express.Router();
const matriculaController= require('../Controllers/matriculaController/matriculaController');
router.get('/departamentos', matriculaController.getDepartamentos);
router.get('/departamentos/:id_Departamento/asignaturas', matriculaController.getAsignaturasByDepartamento);
router.get('/asignaturas/:codigo/secciones', matriculaController.getSeccionesByAsignatura);


router.get('/estudiantes/:id_estudiante/asignaturas', matriculaController.getAsignaturasEstudiante);
router.post('/matricular', matriculaController.matricular);

// Ruta para cancelar matrícula
router.post('/cancelar', matriculaController.cancelarMatricula);

// Ruta para listar asignaturas matriculadas
router.get('/estudiantes/:id_estudiante/asignatura', matriculaController.listarAsignaturasMatriculadas);

// Ruta para actualizar cupos
router.put('/secciones/:id_seccion/cupos', matriculaController.actualizarCupos);


///listar las lista de espera
router.get('/lista-espera/seccion/:id_seccion', matriculaController.listarEstudiantesEnEspera);
router.get('/lista-espera/estudiante/:id_estudiante', matriculaController.listarClasesEnEspera);


module.exports = router;