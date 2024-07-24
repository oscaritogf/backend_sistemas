const express = require('express');
const router = express.Router();
const departmentHeadController = require('../Controllers/jefeController/departmentHeadController');
const { authenticateToken } = require('../middleware/auth');
const { checkRole } = require('../middleware/roleCheck');

//router.get('/data', authenticateToken, checkRole('jefe_departamento'), departmentHeadController.getData);
router.get('/asignaturas', departmentHeadController.getAsignaturas);
router.get('/asignaturas/:id_Departamento', departmentHeadController.getAsignaturasByDepartamento);
router.post('/crear/secciones', departmentHeadController.insertSeccions);
router.get('/secciones', departmentHeadController.getSecciones);
router.get('/docentes', departmentHeadController.getDocentes);
router.get('/aulas', departmentHeadController.getAulas);
router.get('/edificios', departmentHeadController.getEdificios);
router.post('/docentes/activos', departmentHeadController.getActiveDocentesByDepartment);
router.get('/dias', departmentHeadController.getDias);

router.get('/countStudents', departmentHeadController.countStudentsByDepartment);

module.exports = router;