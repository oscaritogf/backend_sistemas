
const supabase = require('../../config/supabase');
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

  exports.putIndiceGlobal = async (req, res) => {
    const { id_estudiante } = req.params;
    try {
      // Obtén las calificaciones globales
      const calificaciones = await getCalificacionesGlobal(id_estudiante);
      
      // Calcula el índice global
      const indiceGlobal = calcularIndice(calificaciones);
      
      // Redondea el índice global al entero más cercano
      const indiceGlobalEntero = Math.round(indiceGlobal);
      
      // Actualiza el índice global del estudiante en la base de datos
      const { data: student, error: errStudent } = await supabase
        .from('estudiante')
        .update({ indice_global: indiceGlobalEntero }) // Enviar el índice redondeado
        .eq('numeroCuenta', id_estudiante);
  
      if (errStudent) throw errStudent;
  
      // Envía la respuesta con el índice global como entero
      res.json({ indiceGlobal: indiceGlobalEntero });
    } catch (error) {
      // Maneja cualquier error
      res.status(500).json({ error: error.message });
    }
  };
  
  exports.getIndicePorPeriodo = async (req, res) => {
    const { id_estudiante, periodo } = req.params;
    try {
      const calificaciones = await getCalificacionesPorPeriodo(id_estudiante, periodo);
      const indicePeriodo = calcularIndice(calificaciones);
      
      res.json({ indicePeriodo });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  exports.putIndicePorPeriodo = async (req, res) => {
    const { id_estudiante, periodo } = req.params;
    try {
      const calificaciones = await getCalificacionesPorPeriodo(id_estudiante, periodo);
      const indicePeriodo = calcularIndice(calificaciones);
      const indicePeriodoEntero = Math.round(indicePeriodo);
      
      const { data: student, error: errStudent } = await supabase
        .from('estudiante')
        .update({ indice_periodo: indicePeriodoEntero })
        .eq('numeroCuenta', id_estudiante);
  
      if (errStudent) throw errStudent;
  
      res.json({ indicePeriodo: indicePeriodoEntero });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
 
  };