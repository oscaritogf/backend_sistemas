exports.getData = async (req, res) => {
    try {
      // Aquí iría la lógica para obtener datos del profesor
      res.json({ message: 'Datos del profesor', data: { id: req.user.userId, tipo: 'docente' } });
    } catch (error) {
      res.status(500).json({ message: 'Error al obtener datos del profesor', error: error.message });
    }
  };