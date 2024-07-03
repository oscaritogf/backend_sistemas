const Admision = require('../models/Admisiones');
const cloudinary = require('../config/cloudinary');

exports.createAdmision = async (req, res) => {
  try {
    const { 
      dni, primer_Nombre, segundo_Nombre, primer_Apellido, segundo_Apellido,
      id_Centro, id_Carrera, id_Sd_Carrera
    } = req.body;

    let imagen_url = '';
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path);
      imagen_url = result.secure_url;
    }

    const admisionData = {
      dni, primer_Nombre, segundo_Nombre, primer_Apellido, segundo_Apellido,
      id_Centro, id_Carrera, id_Sd_Carrera, intentos: 1, imagen: imagen_url
    };

    const newAdmision = await Admision.create(admisionData);
    res.status(201).json(newAdmision);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCentros = async (req, res) => {
  try {
    const centros = await Admision.getCentros();
    res.json(centros);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCarreras = async (req, res) => {
  try {
    const carreras = await Admision.getCarreras();
    res.json(carreras);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};