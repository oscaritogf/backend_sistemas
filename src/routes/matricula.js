const express = require('express');
const router = express.Router();
const matriculaController= require('../Controllers/matriculaController/matriculaController');


router.get('/departamentos', matriculaController.getDepartamentos);
router.get('/asignaturas/:id_Departamento', matriculaController.getAsignaturasByDepartamento);
router.get('/secciones/:codigo', matriculaController.getSeccionesByAsignatura);
router.get('/estudiante/:id_user',matriculaController.getIdEstudiante)

router.get('/estudiantes/:id_estudiante/asignaturas', matriculaController.getAsignaturasEstudiante);
router.post('/proceder-matricula', matriculaController.matricular);


// Ruta para cancelar matrícula
router.post('/cancelar', matriculaController.cancelarMatricula);
router.post('/lista-espera/cancelar', matriculaController.cancelarMatriculaEnEspera);

// Ruta para listar asignaturas matriculadas
router.get('/estudiantes/:id_estudiante/asignatura', matriculaController.listarAsignaturasMatriculadas);

// Ruta para actualizar cupos
router.put('/secciones/:id_seccion/cupos', matriculaController.actualizarCupos);


///listar las lista de espera
router.get('/lista-espera/seccion/:id_seccion', matriculaController.listarEstudiantesEnEspera);
router.get('/lista-espera/estudiante/:id_estudiante', matriculaController.listarClasesEnEspera);

////trae el docente 
router.get('/seccion/:id_seccion', matriculaController.getDocenteInfo);
module.exports = router;