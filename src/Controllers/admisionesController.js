const Admision = require('../models/Admisiones');
const cloudinary = require('../config/cloudinary');
const {sendConfirmationEmail, sendStudentWelcomeEmail, sendRejectionEmail} = require('../utils/emailService')
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const os = require('os');
const supabase = require('../config/supabase');
const bcrypt = require('bcrypt');
const { get } = require('http');



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
      const isCarrera1Ingenieria = carrera1.Facultades.nombre.toLowerCase().includes('ingeniería');
      const isCarrera2Ingenieria = carrera2.Facultades.nombre.toLowerCase().includes('ingeniería');
      const isCarrera1Medicina = carrera1.Facultades.nombre.toLowerCase().includes('medicina');
      const isCarrera2Medicina = carrera2.Facultades.nombre.toLowerCase().includes('medicina');
    
      if (
        (isCarrera1Ingenieria && isCarrera2Medicina) ||
        (isCarrera1Medicina && isCarrera2Ingenieria)
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
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=Admisiones.csv');
    res.send(csv);
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
// End point para validar inscripcion con archivo csv
const verificarFilas = (results) => {
  const filasAptas = [];
  const filasNoAptas = [];

  results.forEach((row, index) => {
    const requiredFields = ['aprobacionPAA', 'aprobacionPAM_PCCNS', 'email', 'primer_Nombre', 'primer_Apellido', 'dni', 'segundo_Nombre', 'segundo_Apellido', 'matricula', 'depto'];
    const cleanedRow = {};

    // Limpiar los campos requeridos, excepto 'Codigo'
    requiredFields.forEach(field => {
      if (row[field] !== null && row[field] !== undefined) {
        if (typeof row[field] === 'string') {
          cleanedRow[field] = row[field].replace(/\s+/g, '');
        } else {
          cleanedRow[field] = row[field];
        }
      } else {
        cleanedRow[field] = '';
      }
    });

    // Agregar 'Codigo' sin ninguna modificación
    cleanedRow['Codigo'] = row['Codigo'];

    // Identificar los campos faltantes
    const missingFields = requiredFields.filter(field => 
      cleanedRow[field] === '' || 
      cleanedRow[field] === null || 
      cleanedRow[field] === undefined
    );

    if (missingFields.length > 0) {
      filasNoAptas.push({ fila: index + 2, error: `Datos faltantes: ${missingFields.join(', ')}`, data: cleanedRow });
    } else {
      filasAptas.push(cleanedRow);
    }
  });

  console.log("Filas Aptas:", filasAptas);
  console.log("Filas No Aptas:", filasNoAptas);

  return { filasAptas, filasNoAptas };
};


exports.getId = async (req, res) => {
        try {
          const { dni } = req.body;
          const { data, error } = await supabase
            .from('Usuario')
            .select('id')
            .eq('Identidad', dni);
      
          if (error) {
            console.error('Error al obtener datos de Usuario', error);
            throw new Error('Error al obtener datos de Usuario');
          }
      
          if (!data || data.length === 0) {
            throw new Error('No hay datos de Usuario');
          }
      
          res.json(data);
        } catch (error) {
          console.error('Error al obtener datos de Usuario', error);
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

exports.getJSON = async (req, res) => {
  try {
    const jsonData = await Admision.getJSON();
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(jsonData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.crearUsuariosDesdeJson = async (req, res) => {
  try {
    const { dataJson } = req.body;

    if (!dataJson || !Array.isArray(dataJson)) {
      return res.status(400).json({ message: 'No se proporcionó el JSON de datos o el formato es incorrecto.' });
    }

    const results = dataJson;
    const { filasAptas, filasNoAptas } = verificarFilas(results);

    console.log("Resultados Verificados - Filas Aptas:", filasAptas);
    console.log("Resultados Verificados - Filas No Aptas:", filasNoAptas);

    const errores = [];
    const filasAptasProcesadas = [];

    try {
      for (const row of filasAptas) {
        const { aprobacionPAA, aprobacionPAM_PCCNS, email, primer_Nombre, primer_Apellido, dni, Codigo, matricula, depto } = row;
        const codigoNumerico = parseInt(row.Codigo, 10);
       
      //   // Añadir aquí la validación del Codigo
      // if (Codigo.length !== 3 || !/^\d{3}$/.test(Codigo)) {
      //   console.error(`Código inválido: ${Codigo}`);
      //   errores.push({ dni, error: `Código inválido: ${Codigo}` });
      //   continue;
      // }
        const generatePassword = () => Math.floor(1000 + Math.random() * 9000);

        const generateUniqueStudentNumber = async () => {
          const currentYear = new Date().getFullYear();
          let uniqueNumber;
          let isUnique = false;

          while (!isUnique) {
            const randomNum = Math.floor(Math.random() * 9999) + 1;
            uniqueNumber = `${currentYear}00${Codigo}${randomNum.toString().padStart(4, '0')}`;

            const { data, error } = await supabase
              .from('estudiante')
              .select('numeroCuenta')
              .eq('numeroCuenta', uniqueNumber);

            if (error) throw error;
            if (data.length === 0) isUnique = true;
          }

          return uniqueNumber;
        };

        const getId = async (dni) => {
          const { data, error } = await supabase
            .from('Usuario')
            .select('id')
            .eq('Identidad', dni)
            .single();

          if (error) throw error;
          if (!data) throw new Error('No se encontró el usuario');

          return data.id;
        };

        const contrasena = generatePassword();
        const hashedPassword = bcrypt.hashSync(contrasena.toString(), 10);
        const numeroCuenta = await generateUniqueStudentNumber(); 
        const correoInstitucional = `${primer_Nombre[0].toLowerCase()}${row.segundo_Nombre[0].toLowerCase()}${primer_Apellido.toLowerCase()}${row.segundo_Apellido.toLowerCase()}@unah.hn`;

        if (isNaN(parseInt(numeroCuenta))) {
          console.error(`Número de cuenta inválido generado: ${numeroCuenta}`);
          errores.push({ dni, error: `Número de cuenta inválido generado: ${numeroCuenta}` });
          continue;
        }

        if (
            matricula.toLowerCase() !== 'ninguna'
        ) {
          const { data: usuariosExistentes, error: users } = await supabase
            .from('Usuario')
            .select('*')
            .eq('Identidad', dni);

          if (users) {
            console.error('Error al obtener datos de Usuario', users);
            errores.push({ dni, error: users.message });
            continue;
          }

          if (usuariosExistentes && usuariosExistentes.length > 0) {
            console.log('El usuario ya existe en la base de datos');
            continue;
          }

          const { data, error } = await supabase
            .from('Usuario')
            .insert([
              {
                Identidad: dni,
                Nombre: `${primer_Nombre} ${row.segundo_Nombre}`,
                Apellido: `${primer_Apellido} ${row.segundo_Apellido}`,
                Correo: email,
                Contrasena: hashedPassword,
              },
            ]).single();

          if (error) {
            console.error('Error al insertar en la tabla Usuario', error);
            errores.push({ dni, error: error.message });
            continue;
          }

          const idUsuario = await getId(dni);

          await sendStudentWelcomeEmail(email, `${primer_Nombre} ${primer_Apellido}`, numeroCuenta, correoInstitucional, contrasena);

          const { error: estudianteError } = await supabase
            .from('estudiante')
            .insert([
              {
                numeroCuenta,
                correo_Institucional: correoInstitucional,
                usuario: parseInt(idUsuario),
                id_Depto: depto
              },
            ]);

          if (estudianteError) {
            console.error('Error al insertar en la tabla estudiante', estudianteError);
            errores.push({ dni, error: estudianteError.message });
            continue;
          }

          const { error: rolError } = await supabase
            .from('UsuarioRol')
            .insert([
              {
                id_Rol: 2,
                id_Usuario: parseInt(idUsuario),
              },
            ]);

          if (rolError) {
            console.error('Error al insertar en la tabla UsuarioRol', rolError);
            errores.push({ dni, error: rolError.message });
          } else {
            console.log('Datos insertados en la tabla UsuarioRol');
          }
        } else {
          await sendRejectionEmail(email, `${primer_Nombre} ${primer_Apellido}`);
        }

        filasAptasProcesadas.push(row); // Almacenar las filas procesadas exitosamente
      }

      console.log('Datos procesados e insertados en la tabla Usuario');
      res.status(200).json({ 
        message: 'Datos procesados e insertados en la tabla Usuario', 
        errores,
        filasNoAptas,
        filasAptasProcesadas: filasAptasProcesadas.length,
        totalFilas: results.length
      });

    } catch (error) {
      console.error('Error al procesar los datos:', error);
      res.status(500).json({ message: 'Error al procesar los datos', error });
    }
  } catch (error) {
    console.error('Error al crear usuarios desde JSON', error);
    res.status(500).json({ message: 'Error al crear usuarios desde JSON', error });
  }
};
