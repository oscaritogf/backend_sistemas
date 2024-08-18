const express = require('express');
const router = express.Router();
const teacherController = require('../Controllers/teacherController');
const { authenticateToken } = require('../middleware/auth');
const { checkRole } = require('../middleware/roleCheck');

// router.get('/data', authenticateToken, checkRole('docente'), teacherController.getData);
router.post('/secciones', teacherController.getSecciones);
router.get('/estudiantes/:seccion', teacherController.getStudentsExcel);
router.get('/students/:Seccion', teacherController.getStudents);

router.post('/fcourse', teacherController.finishCourse);
router.post('/notas', teacherController.uploadNotes);
router.put('/notasU', teacherController.updateNotes);
router.put('/video', teacherController.updateVideo);
router.get('/idUser/:numeroEmpleado', teacherController.getIdUser);

module.exports = router;