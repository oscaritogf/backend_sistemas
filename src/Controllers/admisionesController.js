const Admision = require('../models/Admisiones');
const cloudinary = require('../config/cloudinary');
const {sendConfirmationEmail} = require('../utils/emailService')

exports.createAdmision = async (req, res) => {
  try {
    const { 
      dni, primer_Nombre, segundo_Nombre, primer_Apellido, segundo_Apellido,
      id_Centro, id_Carrera, id_Sd_Carrera, email, certificado
    } = req.body;

// Validación de carreras
    const carreras = await Admision.getCarreras();
    const carrera1 = carreras.find(c => c.id_Carrera === parseInt(id_Carrera));
    const carrera2 = carreras.find(c => c.id_Carrera === parseInt(id_Sd_Carrera));

    if (carrera1 && carrera2) {
      const facultadIngenieria = carreras.find(c => c.Facultades.nombre.toLowerCase().includes('ingeniería'))?.Facultades.id_Facultad;
      const facultadMedicina = carreras.find(c => c.Facultades.nombre.toLowerCase().includes('medicina'))?.Facultades.id_Facultad;

      if (
        (carrera1.id_Facultad === facultadIngenieria && carrera2.id_Facultad === facultadMedicina) ||
        (carrera1.id_Facultad === facultadMedicina && carrera2.id_Facultad === facultadIngenieria)
      ) {
        return res.status(400).json({ message: 'No puedes elegir una carrera de Ingeniería y otra de Medicina al mismo tiempo' });
      }
    }

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

    //generar notas aleatorias
    const generarNotaConSesgoPositivo = (min, max, sesgo = 0.7)=>{
      const random = Math.pow(Math.random(), sesgo);
      return Math.floor(random * (max - min) + min)
    };

    const nota1 = generarNotaConSesgoPositivo(700, 1400);
    const nota2 = generarNotaConSesgoPositivo(400, 600);
    console.log(`Nota1: ${nota1}, PuntajeRequerido: ${carrera1.puntajeRequerido}`); // Para depuración

    const aprobacionPAA = nota1 >= carrera1.puntajeRequerido ? 'reprobó' : 'aprobó';
    let aprobacionPAM_PCCNS = 'no aplica';

    if (carrera1.Facultades.nombre.toLowerCase().includes('ingeniería')|| 
    carrera1.Facultades.nombre.toLowerCase().includes('medicina')) {
      aprobacionPAM_PCCNS = nota2 >= 500 ? 'aprobó' : 'reprobó';
    }

    const admisionData = {
      dni, primer_Nombre, segundo_Nombre, primer_Apellido, segundo_Apellido,
      id_Centro, id_Carrera, id_Sd_Carrera, email, intentos: intentosExistentes+1, imagen: imagen_url,
      nota1, nota2, aprobacionPAA, aprobacionPAM_PCCNS
    };

    
    const newAdmision = await Admision.create(admisionData);
    
    //aqui envia el correo 
    await sendConfirmationEmail(email, primer_Nombre);
    
    res.status(201).json(newAdmision);
  } catch (error) {
    console.error('error en crearte Admisiones', error)
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
    console.log('Carreras obtenids', carreras);
    res.json(carreras);
  } catch (error) {
    console.error('Error al obtener correras: ', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getExamenesCarrera = async (req, res) => {
  try {
    const { carreraId } = req.params;
    const examenes = await Admision.getExamenes(carreraId);
    res.json(examenes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

