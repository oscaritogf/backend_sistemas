  const Teacher = require('../models/Teacher');
  const supabase = require('../config/supabase');
  const  { sendNotesNtfy }= require('../utils/emailService');

  exports.updateVideo = async (req, res) => {
    try {
      const { id_Secciones, urlVideo } = req.body;
      const response = await Teacher.updateVideo(id_Secciones, urlVideo);
      res.json({ message: 'Video actualizado' });
    } catch (error) {
      res.status(500).json({ message: 'Error al actualizar el video', error: error.message });
    }
  };

  exports.getIdUser = async (req, res) => {
    try {
      const { numeroEmpleado } = req.params;
      const {usuario: id_usuario} = await Teacher.getIdUser(numeroEmpleado);
      res.json({ message: 'ID de usuario obtenido', id_usuario });
    } catch (error) {
      res.status(500).json({ message: 'Error al obtener el ID de usuario', error: error.message });
    }
  }
  
  exports.getSecciones = async (req, res) => {
    try {
      const  { docente } = req.body;
      const secciones = await Teacher.getSeccionesByDocente(docente);
      res.json({ message: 'Secciones del profesor', data: secciones });

    }catch (error) {
      res.status(500).json({ message: 'Error al obtener las secciones del profesor', error: error.message });
       }  
    };


    exports.getProcesoNota = async (req, res) => {
    try {
        const procesoNotas = await Teacher.getProcesoNota();
        const today = new Date().toISOString().split('T')[0]; // Obtén la fecha actual en formato YYYY-MM-DD
        const filteredProcesoNotas = procesoNotas.filter(proceso => 
            proceso.fecha_inicio <= today && proceso.fecha_final >= today
        );
        res.json({ message: 'Lista de procesoNotas', data: filteredProcesoNotas });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error al obtener la lista de procesos', error: error.message });
    }
};

// Controlador ajustado para enviar el archivo Excel
exports.getStudentsExcel = async (req, res) => {
  try {
      const { seccion } = req.params;
      const students = await Teacher.getStudentsBySeccion(seccion);
      await Teacher.saveListStudents(students, res);  // Se pasa `res` al método para enviar el archivo
  } catch (error) {
      res.status(500).json({ message: 'Error al obtener los estudiantes de la sección', error: error.message });
  }
};

exports.getStudents = async (req, res) => {
  try {
    const { Seccion } = req.params;
    const students = await Teacher.getStudentsBySeccion(Seccion);
    res.json({ message: 'Estudiantes de la sección', data: students });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los estudiantes de la sección', error: error.message });
  }
};  

exports.getStudentNota = async (req, res) => {
  try {
    const { id_Seccion } = req.params;

    // Obtener los estudiantes de la sección
    const studentsResponse = await Teacher.getStudentsBySeccion(id_Seccion);
    const { estudiantes, codigo , seccion} = studentsResponse;

    // Obtener las notas y observaciones de los estudiantes de la sección
    const notas = await Teacher.getNotasBySeccion(id_Seccion);

    // Combinar la información de los estudiantes con sus notas y observaciones
    const estudiantesConNotas = estudiantes.map(estudiante => {
      const numeroCuentaEstudiante = estudiante.estudiante[0]?.numeroCuenta;
      const notaEstudiante = notas.find(nota => nota.id_Estudiante === numeroCuentaEstudiante);
      return {
        ...estudiante,
        nota: notaEstudiante ? notaEstudiante.nota : null,
        obs: notaEstudiante ? notaEstudiante.obs : null,
      };
    });

    res.json({ 
      message: 'Estudiantes de la sección con sus notas y observaciones', 
      seccion: codigo, 
      estudiantes: estudiantesConNotas ,
      id_Seccion: seccion,
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error al obtener los estudiantes de la sección', 
      error: error.message 
    });
  }
};

    exports.finishCourse = async (req, res) => {
      try {
        const { id_Secciones, id_Asignaturas } = req.body;
        
        console.log('Iniciando finishCourse con id_Secciones:', id_Secciones, 'y id_Asignaturas:', id_Asignaturas);
    
        // Obtener la lista de estudiantes en la sección
        const response = await Teacher.getStudentsBySeccion(id_Secciones);
    
        console.log('Respuesta completa de getStudentsBySeccion:', JSON.stringify(response, null, 2));
    
        if (!response || typeof response !== 'object') {
          throw new Error('La respuesta es inválida');
        }
    
        if (!Array.isArray(response.estudiantes)) {
          throw new Error('La propiedad "estudiantes" no es un array');
        }
    
        const students = response.estudiantes;
    
        console.log('Número de estudiantes encontrados:', students.length);
    
        // Iterar sobre cada estudiante y enviar el correo
        for (const student of students) {
          console.log('Procesando estudiante:', JSON.stringify(student, null, 2));
    
          if (!student.estudiante || !Array.isArray(student.estudiante) || student.estudiante.length === 0) {
            throw new Error(`Datos del estudiante incorrectos para ${student.Nombre} ${student.Apellido}`);
          }
    
          const numeroCuenta = student.estudiante[0].numeroCuenta;
          console.log('Enviando notificación para numeroCuenta:', numeroCuenta);
          await sendNotesNtfy(id_Secciones, numeroCuenta, id_Asignaturas);
        }
    
        res.json({ message: 'Curso finalizado y notificaciones enviadas' });
    
      } catch (error) {
        console.error('Error detallado:', error);
        console.error('Stack trace:', error.stack);
        res.status(500).json({ message: 'Error al finalizar el curso', error: error.message });
      }
    };

  // Backend - ejemplo de cómo enviar mensajes de éxito o error
exports.uploadNotes = async (req, res) => {
  try {
    const notas = req.body; // Recibe el array completo de notas

    let results = [];
    for (const nota of notas) {
      const { id_Secciones, id_Docentes, id_Estudiante, nota: score, proceso, detail } = nota;
      const resultado = await Teacher.uploadNotes(id_Secciones, id_Docentes, id_Estudiante, score, proceso, detail);
      results.push(resultado);
    }

    // Verifica si hubo algún mensaje de error en los resultados
    const errorMessages = results.filter(result => result.message && result.message !== 'Nota registrada').map(result => result.message);
    
    if (errorMessages.length > 0) {
      return res.status(400).json({ message: errorMessages.join(', ') });
    }

    res.json({ message: 'Notas registradas con éxito' });
  } catch (error) {
    res.status(500).json({ message: 'Error al subir notas', error: error.message });
  }
};


exports.updateNotes = async (req, res) => {
  try {
    const { id_Secciones, id_Docentes, id_Estudiante, nota, proceso } = req.body;
    const result = await Teacher.updateNotes(id_Secciones, id_Docentes, id_Estudiante, nota, proceso);

    if (result.error) {
      return res.status(400).json({ message: result.error });
    }

    res.json({ message: result.message });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar notas', error: error.message });
  }
}

