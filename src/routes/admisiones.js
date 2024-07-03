const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const admisionesController = require('../Controllers/admisionesController');

router.post('/', upload.single('certificado'), admisionesController.createAdmision);
router.get('/centros', admisionesController.getCentros);
router.get('/carreras', admisionesController.getCarreras);

module.exports = router;