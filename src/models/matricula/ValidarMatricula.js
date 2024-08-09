// src/models/matricula/ValidarMatricula.js
const supabase = require('../../config/supabase');

const obtenerEstudiantePorId = async (numeroCuenta) => {
  try {
   
    const { data, error } = await supabase
      .from('estudiante')
      .select('*')
      .eq('numeroCuenta', numeroCuenta)
      .single();

    if (error) {
      console.error('Error al obtener estudiante:', error);
      throw error;
    }
  
    return data;
  } catch (error) {
    console.error('Error en obtenerEstudiantePorId:', error);
    throw error;
  }
};

const obtenerConfiguracionMatricula = async (indice_periodo) => {
    try {
      
      // Primero, obtengamos todas las configuraciones
      const { data, error } = await supabase
        .from('ConfiguracionMatricula')
        .select('*')
        .order('id_ConfMatri', { ascending: false });
  
      if (error) {
        console.error('Error al obtener configuración de matrícula:', error);
        throw error;
      }
  
     
      // Ahora, busquemos la configuración correcta basada en el índice
      const configuracionCorrecta = data.find(config => 
        (indice_periodo >= config.indice_desdeMatri1 && indice_periodo <= config.indice_hastaMatri1) ||
        (indice_periodo >= config.indice_desdeMatri2 && indice_periodo <= config.indice_hastaMatri2) ||
        (indice_periodo >= config.indice_desdeMatri3 && indice_periodo <= config.indice_hastaMatri3) ||
        (indice_periodo >= config.indice_desdeMatri4 && indice_periodo <= config.indice_hastaMatri4) ||
        (indice_periodo >= config.indice_desdeMatri5 && indice_periodo <= config.indice_hastaMatri5)
      );
  
      if (configuracionCorrecta) {
      
        return configuracionCorrecta;
      } else {
         return null;
      }
    } catch (error) {
      console.error('Error en obtenerConfiguracionMatricula:', error);
      throw error;
    }
  };

const obtenerHistorialCalificaciones = async (id_estudiante) => {
  try {
   
    const { data, error } = await supabase
      .from('Calificaciones_Registro')
      .select('*')
      .eq('id_Estudiante', id_estudiante)
      .limit(1);

    if (error) {
      console.error('Error al obtener historial de calificaciones:', error);
      throw error;
    }

   
    return data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('Error en obtenerHistorialCalificaciones:', error);
    throw error;
  }
};

const obtenerAdmision = async (dni) => {
  try {
   
    const { data, error } = await supabase
      .from('Admisiones')
      .select('*')
      .eq('dni', dni)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error al obtener admisión:', error);
      throw error;
    }

    
    return data;
  } catch (error) {
    console.error('Error en obtenerAdmision:', error);
    throw error;
  }
};

module.exports = {
  obtenerEstudiantePorId,
  obtenerConfiguracionMatricula,
  obtenerHistorialCalificaciones,
  obtenerAdmision,
};