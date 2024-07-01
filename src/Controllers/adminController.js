exports.getData = async (req, res) => {
    try {
      // Aquí iría la lógica para obtener datos del administrador
      res.json({ message: 'Datos del administrador', data: { id: req.user.userId, tipo: 'admin' } });
    } catch (error) {
      res.status(500).json({ message: 'Error al obtener datos del administrador', error: error.message });
    }
  };