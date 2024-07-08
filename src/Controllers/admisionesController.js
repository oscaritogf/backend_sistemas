const Admision = require('../models/Admisiones');
const cloudinary = require('../config/cloudinary');
const {sendConfirmationEmail} = require('../utils/emailService')

exports.createAdmision = async (req, res) => {
  try {
    const { 
      dni, primer_Nombre, segundo_Nombre, primer_Apellido, segundo_Apellido,
      id_Centro, id_Carrera, id_Sd_Carrera, email, certificado
    } = req.body;

    const intentosExistentes =  await Admision.getIntentosByDNI(dni);

    //vrifica el numero de intentos maximo
    if(intentosExistentes >=3){
      return res.status(400).json({message: "Has alcanzo el numero maximo de intentos permitido"});
    }

    let imagen_url = '';
    if (certificado) {
      const result = await cloudinary.uploader.upload(certificado, {
        folder: 'certificado'
    });
      imagen_url = result.secure_url;
    }

    const admisionData = {
      dni, primer_Nombre, segundo_Nombre, primer_Apellido, segundo_Apellido,
      id_Centro, id_Carrera, id_Sd_Carrera, email, intentos: intentosExistentes+1, imagen: imagen_url
    };

    
    const newAdmision = await Admision.create(admisionData);
    //aqui envia el correo 
    await sendConfirmationEmail(email, primer_Nombre);
    
    res.status(201).json(newAdmision);
  } catch (error) {
    console.error('error en ceate Admisiones', error)
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