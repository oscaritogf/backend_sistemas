const express = require('express');
const router = express.Router();
const adminController = require('../Controllers/adminController');
const { authenticateToken } = require('../middleware/auth');
const { checkRole } = require('../middleware/roleCheck');

//router.get('/data', authenticateToken, checkRole('admin'), adminController.getData);
router.post('/empleados', adminController.createEmpleado);
router.put('/empleados/:id', adminController.updateEmpleado);
router.get('/empleados', adminController.listEmpleados);

router.get('/roles', adminController.getRoles);
module.exports = router;

//put: http://localhost:3000/api/admin/empleados/1 
//get: http://localhost:3000/api/admin/empleados
//post:http://localhost:3000/api/admin/empleados

