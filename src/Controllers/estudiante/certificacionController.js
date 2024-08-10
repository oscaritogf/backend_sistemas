const { getCertificacion, getCalificacionesGlobal, getCalificacionesPorPeriodo } = require('../../models/estudiante/Certificacion');

exports.getCertificacion = async (req, res) => {
  const { id_estudiante } = req.params;
  try {
    const certificacion = await getCertificacion(id_estudiante);
    res.json(certificacion);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const calcularIndice = (calificaciones) => {
  const totalUV = calificaciones.reduce((sum, { Asignaturas }) => sum + Asignaturas.uv, 0);
  const totalPonderado = calificaciones.reduce((sum, { nota, Asignaturas }) => sum + (nota * Asignaturas.uv), 0);
  
  return totalPonderado / totalUV;
};

exports.getIndiceGlobal = async (req, res) => {
  const { id_estudiante } = req.params;
  try {
    const calificaciones = await getCalificacionesGlobal(id_estudiante);
    const indiceGlobal = calcularIndice(calificaciones);
    
    res.json({ indiceGlobal });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getIndicePorPeriodo = async (req, res) => {
  const { id_estudiante, id_cunfigMatricula } = req.params;
  try {
    const calificaciones = await getCalificacionesPorPeriodo(id_estudiante, id_cunfigMatricula);
    const indicePeriodo = calcularIndice(calificaciones);
    
    res.json({ indicePeriodo });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
