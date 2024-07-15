const Admision = require('../models/Admisiones');
const cloudinary = require('../config/cloudinary');
const {sendConfirmationEmail} = require('../utils/emailService')
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const os = require('os');



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

exports.sendApproved = async (req, res) => {

      //generar correo institucional
      const correoInstitucional = `${primer_Nombre[0].toLowerCase()}.${segundo_Nombre[0].toLowerCase()}.${primer_Apellido.toLowerCase()}.${segundo_Apellido.toLowerCase()}@unah.hn`;

};

exports.getCSV = async (req, res) => {
  try {
    const csv = await Admision.getCSV();

    if (!csv) {
      return res.status(404).json({ message: 'No hay datos para exportar' });
    }
    const filePath = path.join(require('os').homedir(), 'Downloads', 'Admisiones.csv'); // Replace with the desired file path
    await fs.WriteStream(filePath, csv);
    
    res.json({ message: 'CSV file saved successfully', path: filePath });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=Admisiones.csv');
    res.send(csv);

     
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.saveCSV = async (req, res) => {
  try {
    const csv = await Admision.getCSV();
    const filePath = path.join(require('os').homedir(),'Downloads/Admisiones.csv'); // Replace with the desired file path
    fs.writeFileSync(filePath, csv);
    res.json({ message: 'CSV file saved successfully' });
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
    console.log('Carreras obtenids', carreras);
    res.json(carreras);
  } catch (error) {
    console.error('Error al obtener correras: ', error);
    res.status(500).json({ message: error.message });
  }
};

// Controlador para obtener los exámenes por carrera
exports.getExamenesCarrera = async (req, res) => {
  
  try {
    const { carreraId } = req.params;
    const examenes = await Admision.getExamenes(carreraId);
    res.json(examenes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Nuevo endpoint para obtener las notas y determinar la carrera aprobada
exports.getNotasByDNI = async (req, res) => {
  try {
    const { dni } = req.params;
    const notas = await Admision.getNotasByDNI(dni);

    if (!notas) {
      return res.status(404).json({ message: 'No se encontraron notas para el DNI proporcionado' });
    }

    const carreras = await Admision.getCarreras();
    const carrera1 = carreras.find(c => c.id_Carrera === notas.id_Carrera);
    const carrera2 = carreras.find(c => c.id_Carrera === notas.id_Sd_Carrera);

    const resultado = {
      nota1: notas.nota1,
      nota2: notas.nota2,
      carrera1: {
        nombre: carrera1.nombre,
        aprobacion: notas.nota1 >= carrera1.puntajeRequerido ? 'aprobó' : 'reprobó'
      },
      carrera2: {
        nombre: carrera2.nombre,
        aprobacion: notas.nota1 >= carrera2.puntajeRequerido ? 'aprobó' : 'reprobó'
      }
    };

    // Verificar si la carrera1 existe y tiene Facultades
    if (carrera1 && carrera1.Facultades) {
      if (carrera1.Facultades.nombre.toLowerCase().includes('facultad de ingeniería') ||
          carrera1.Facultades.nombre.toLowerCase().includes('facultad de medicina')) {
        if (notas.nota2 >= 500) {
          resultado.carrera1.aprobacionPAM_PCCNS = 'aprobó';
        } else if (notas.nota1 >= carrera1.puntajeRequerido) {
          resultado.carrera1.aprobacionPAM_PCCNS = 'reprobó, pero puede ingresar a la carrera que no requiere PAM o PCCNS';
        } else {
          resultado.carrera1.aprobacionPAM_PCCNS = 'reprobó';
        }
      }
    }

    // Verificar si la carrera2 existe y tiene Facultades
    if (carrera2 && carrera2.Facultades) {
      if (carrera2.Facultades.nombre.toLowerCase().includes('facultad de ingeniería') ||
          carrera2.Facultades.nombre.toLowerCase().includes('facultad de medicina')) {
        if (notas.nota2 >= 500) {
          resultado.carrera2.aprobacionPAM_PCCNS = 'aprobó';
        } else if (notas.nota1 >= carrera2.puntajeRequerido) {
          resultado.carrera2.aprobacionPAM_PCCNS = 'reprobó, pero puede ingresar a una carrera que no requiere PAM o PCCNS';
        } else {
          resultado.carrera2.aprobacionPAM_PCCNS = 'reprobó';
        }
      }
    }

    res.json(resultado);
  } catch (error) {
    console.error('Error al obtener notas por DNI', error);
    res.status(500).json({ message: error.message });
  }
};




