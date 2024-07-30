const express = require('express');
const router = express.Router();
const coordinatorController = require('../Controllers/coordinatorController');
const { authenticateToken } = require('../middleware/auth');
const { checkRole } = require('../middleware/roleCheck');

router.get('/data', authenticateToken, checkRole('coordinador'), coordinatorController.getData);
router.post('/secciones', coordinatorController.getSeccionesByDepartamento);
router.post('/secciones/pdf', coordinatorController.saveSeccionesPdf);
router.post('/secciones/excel', coordinatorController.saveSeccionesExcel);

module.exports = router;