const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const admisionesController = require('../Controllers/admisionesController');

router.post('/', upload.single('certificado'), admisionesController.createAdmision);
router.get('/centros', admisionesController.getCentros);
router.get('/carreras', admisionesController.getCarreras);
router.get('/carreras/:carreraId/examenes', admisionesController.getExamenesCarrera);
router.get('/notas/:dni', admisionesController.getNotasByDNI);

router.get('/csv', admisionesController.saveCSV);
router.post('/id', admisionesController.getId);


router.post('/usuarios/json', admisionesController.crearUsuariosDesdeJson);
router.get('/json', admisionesController.getJSON);

module.exports = router;