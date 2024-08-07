const express = require('express');
const router = express.Router();
const teacherController = require('../Controllers/teacherController');
const { authenticateToken } = require('../middleware/auth');
const { checkRole } = require('../middleware/roleCheck');

// router.get('/data', authenticateToken, checkRole('docente'), teacherController.getData);
router.post('/secciones', teacherController.getSecciones);
router.post('/estudiantes', teacherController.getStudents);

router.post('/fcourse', teacherController.finishCourse);
router.post('/notas', teacherController.uploadNotes);
router.put('/notas', teacherController.updateNotes);

module.exports = router;