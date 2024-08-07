const express = require('express');
const router = express.Router();
const departmentHeadController = require('../Controllers/jefeController/departmentHeadController');
const { authenticateToken } = require('../middleware/auth');
const { checkRole } = require('../middleware/roleCheck');

//router.get('/data', authenticateToken, checkRole('jefe_departamento'), departmentHeadController.getData);
router.get('/asignaturas', departmentHeadController.getAsignaturas);
router.get('/asignaturas/:id_Departamento', departmentHeadController.getAsignaturasByDepartamento);
router.get('/edificios/:id_Centro', departmentHeadController.getEdificiosByCentro);
router.post('/Nsecciones', departmentHeadController.insertSeccions);
router.get('/secciones', departmentHeadController.getSecciones);
router.get('/secciones/:codigo', departmentHeadController.getSeccionesByAsignatura);
//traer la seccion para modificar
router.get('/seccionesFiltro/:id_Secciones', departmentHeadController.getSeccionesFiltro);

router.get('/docentes', departmentHeadController.getDocentes);
router.get('/aulas/:idEdificio', departmentHeadController.getAulasByEdificio);
router.get('/aulas', departmentHeadController.getAulas);
router.get('/tipoAulas', departmentHeadController.getTiposAulas);
router.get('/edificios', departmentHeadController.getEdificios);
router.post('/docentes/activos', departmentHeadController.getActiveDocentesByDepartment);
router.get('/dias', departmentHeadController.getDias);

router.get('/countStudents', departmentHeadController.countStudentsByDepartment);
router.put('/cupos', departmentHeadController.updateSectionCupos);
router.delete('/just', departmentHeadController.cancelSection);
router.post('/rqspass', departmentHeadController.activateChange);
router.post('/passCgd', departmentHeadController.changePassword);
router.post('/useccion', departmentHeadController.updateSection);

module.exports = router;