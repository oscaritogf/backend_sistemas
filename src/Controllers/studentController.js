exports.getData = async (req, res) => {
    try {
      // Aquí iría la lógica para obtener datos del estudiante
      res.json({ message: 'Datos del estudiante', data: { id: req.user.userId, tipo: 'estudiante' } });
    } catch (error) {
      res.status(500).json({ message: 'Error al obtener datos del estudiante', error: error.message });
    }
  };