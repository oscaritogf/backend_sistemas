  const Teacher = require('../models/Teacher');
  const supabase = require('../config/supabase');
  
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

    }catch (error) {
      res.status(500).json({ message: 'Error al obtener los estudiantes de la seccion', error: error.message });
       }  
    }


