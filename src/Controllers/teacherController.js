  const Teacher = require('../models/Teacher');
  const supabase = require('../config/supabase');
  const  { sendNotesNtfy }= require('../utils/emailService');
  
  exports.getSecciones = async (req, res) => {
    try {
      const  { docente } = req.body;
      const secciones = await Teacher.getSeccionesByDocente(docente);
      res.json({ message: 'Secciones del profesor', data: secciones });

    }catch (error) {
      res.status(500).json({ message: 'Error al obtener las secciones del profesor', error: error.message });
       }  
    };

  exports.getStudents = async (req, res) => {
    try {
      const  { seccion } = req.body;
      const students = await Teacher.getStudentsBySeccion(seccion);
      res.json({ message: 'Estudiantes de la seccion', data: students });
      // await Teacher.saveListStudents(students);

    }catch (error) {
      res.status(500).json({ message: 'Error al obtener los estudiantes de la seccion', error: error.message });
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

exports.uploadNotes = async (req, res) => {
  try{
    const {id_Secciones, id_Docentes, id_Estudiante ,nota, proceso} = req.body;
    const notas = await Teacher.uploadNotes(id_Secciones, id_Docentes, id_Estudiante, nota, proceso);
    res.json({ message: 'Notas subidas', data: notas});        

  }catch (error) {
    res.status(500).json({ message: 'Error al subir notas', error: error.message });
  }
};

exports.updateNotes = async (req, res) => {
  try{
    const {id_Secciones, id_Docentes, id_Estudiante ,nota, proceso} = req.body;
    const notas = await Teacher.updateNotes(id_Secciones, id_Docentes, id_Estudiante, nota, proceso);
    res.json({ message: 'Notas actualizadas', data: notas});        

  }catch (error) {
    res.status(500).json({ message: 'Error al actualizar notas', error: error.message });
  }
}

