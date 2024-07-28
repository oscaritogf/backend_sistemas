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


