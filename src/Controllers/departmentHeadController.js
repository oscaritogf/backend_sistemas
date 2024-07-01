exports.getData = async (req, res) => {
    try {
      // Aquí iría la lógica para obtener datos del jefe de departamento
      res.json({ message: 'Datos del jefe de departamento', data: { id: req.user.userId, tipo: 'jefe_departamento' } });
    } catch (error) {
      res.status(500).json({ message: 'Error al obtener datos del jefe de departamento', error: error.message });
    }
  };