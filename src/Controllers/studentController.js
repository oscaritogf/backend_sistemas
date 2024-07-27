const Student = require('../models/Student');
const supabase = require('../config/supabase');

exports.getData = async (req, res) => {
    try {
      // Aquí iría la lógica para obtener datos del estudiante
      res.json({ message: 'Datos del estudiante', data: { id: req.user.userId, tipo: 'estudiante' } });
    } catch (error) {
      res.status(500).json({ message: 'Error al obtener datos del estudiante', error: error.message });
    }
  };

exports.putImg = async (req, res) => {
    try {
        const { img1, img2, img3, id } = req.body;
        const data = await Student.putImg1(img1, img2, img3, id);
        res.json({ message: 'Imagenes actualizadas', data });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar imagenes', error: error.message });
    }
};

