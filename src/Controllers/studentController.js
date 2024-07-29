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

exports.updateProfile = async (req, res) => {
    try {
        const { id_Usuario } = req.params;
        const { Fotografia1, Fotografia2, Fotografia3 } = req.files;

        const usuarioData = {...req.body, Fotografia1, Fotografia2, Fotografia3, id_Usuario};

        console.log('Datos de usuario:', usuarioData);

        const data = await Student.updateProfile(id_Usuario, usuarioData);
        res.json({ message: 'Perfil actualizado', data });
        // res.json({ message: 'Perfil actualizado', usuarioData });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar perfil', error: error.message });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const { id_Usuario } = req.params;
        const data = await Student.getProfile(id_Usuario);
        res.json({ message: 'Perfil obtenido', data });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener perfil', error: error.message });
    }
}
