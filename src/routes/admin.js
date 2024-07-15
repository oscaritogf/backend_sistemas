const express = require('express');
const router = express.Router();
const adminController = require('../Controllers/adminController');
const { authenticateToken } = require('../middleware/auth');
const { checkRole } = require('../middleware/roleCheck');
// multer para subir archivos (imagenes) al servidor
const multer = require('multer');
// configuracion de multer para subir archivos al servidor en la carpeta uploads
const upload = multer({ dest: 'uploads/' });

//router.get('/data', authenticateToken, checkRole('admin'), adminController.getData);
router.post('/empleados',upload.single('imagen'), adminController.createEmpleado);
router.put('/empleados/:numeroEmpleado',upload.single('imagen'), adminController.updateEmpleado);
router.get('/empleados', adminController.listEmpleados);
router.get('/noticias', adminController.getNoticias);
router.post('/noticias', upload.single('imagen'), adminController.createNoticia);
router.put('/noticias/:id_noticia',upload.single('imagen'), adminController.updateNoticia);
router.delete('/noticias/:id_noticia', adminController.deleteNoticia);
router.get('/pac', adminController.getPac);
router.get('/matricula', adminController.getTipoMatricula);
router.get('/roles', adminController.getRoles);
router.get('/centros', adminController.getCentros);  
router.post('/cancelaciones', adminController.createCancelacion);


module.exports = router;

//put: http://localhost:3000/api/admin/empleados/1 
//get: http://localhost:3000/api/admin/empleados
//post:http://localhost:3000/api/admin/empleados

