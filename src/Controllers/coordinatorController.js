exports.getData = async (req, res) => {
    try {
      // Aquí iría la lógica para obtener datos del coordinador
      res.json({ message: 'Datos del coordinador', data: { id: req.user.userId, tipo: 'coordinador' } });
    } catch (error) {
      res.status(500).json({ message: 'Error al obtener datos del coordinador', error: error.message });
    }
  };