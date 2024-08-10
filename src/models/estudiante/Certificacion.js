const supabase = require('../../config/supabase');

const getCertificacion = async (id_estudiante) => {
  try {
    const { data, error } = await supabase
      .from('Calificaciones_Registro')
      .select(`
        id_CR,
        nota,
        Asignaturas (
          codigo,
          nombre,
          uv
        ),
        ConfiguracionMatricula(
        )
        fecha_inicioPAC,
        fecha_finPAC,
      `)
      .eq('id_Estudiante', id_estudiante);

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
};

const getCalificacionesGlobal = async (id_estudiante) => {
    try {
      const { data, error } = await supabase
        .from('Calificaciones_Registro')
        .select(`
          nota,
          Asignaturas(
          uv
          )
        `)
        .eq('id_Estudiante', id_estudiante);
  
      if (error) throw error;
  
      return data;
    } catch (error) {
      throw error;
    }
  };

  const getCalificacionesPorPeriodo = async (id_estudiante, periodo) => {
    try {
      const { data, error } = await supabase
        .from('Calificaciones_Registro')
        .select(`
          nota,
          Asignaturas(
          uv
          ),
          ConfiguracionMatricula(
            fecha_inicioPAC,
            fecha_finPAC
          )
        `)
        .eq('id_Estudiante', id_estudiante)
        
      if (error) throw error;
  
      return data;
    } catch (error) {
      throw error;
    }
  };

  

module.exports = {
    getCertificacion,
    getCalificacionesGlobal,
    getCalificacionesPorPeriodo
};