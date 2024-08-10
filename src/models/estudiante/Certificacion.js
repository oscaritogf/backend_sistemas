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
        )
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
        Asignaturas(uv)
      `)
      .eq('id_Estudiante', id_estudiante);
  
    if (error) throw error;
  
    return data;
  } catch (error) {
    throw error;
  }
};

const getCalificacionesPorPeriodo = async (id_estudiante, id_cunfigMatricula) => {
  try {
    const { data, error } = await supabase
      .from('Calificaciones_Registro')
      .select(`
        nota,
        Asignaturas(
        uv
        ),
        id_CunfigMatricula
      `)
      .eq('id_Estudiante', id_estudiante)
      .eq('id_CunfigMatricula', id_cunfigMatricula);
        
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
