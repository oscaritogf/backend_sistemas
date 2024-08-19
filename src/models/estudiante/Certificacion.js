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


const getCertificacionVOAE = async (id_estudiante) => {
  try {
    const { data, error } = await supabase
      .from('Calificaciones_Registro')
      .select(`
        id_CR,
        nota,
        estudiante( Usuario(Nombre, Apellido), Departamentos(Nombre) ) ,
        ConfiguracionMatricula(id_Pac, fecha_inicioPAC),
        Asignaturas (
          codigo,
          nombre,
          uv
        )
      `)
      .eq('id_Estudiante', id_estudiante);

    if (error) throw error;

    // Obtener la información del estudiante directamente del primer elemento
    const infoEstudiante = {
      nombre: `${data[0].estudiante.Usuario.Nombre} ${data[0].estudiante.Usuario.Apellido}`.toUpperCase(),
      departamento: data[0].estudiante.Departamentos.Nombre.toUpperCase(),
    };

    // Procesar los datos y agrupar por año y periodo
    const processedData = data.map((item) => {
      const year = new Date(item.ConfiguracionMatricula.fecha_inicioPAC).getFullYear();
      const periodo = item.ConfiguracionMatricula.id_Pac == 1 
        ? 'Primer Periodo' 
        : item.ConfiguracionMatricula.id_Pac == 2 
        ? 'Segundo Periodo' 
        : 'Tercer Periodo';

      return {
        anio: year,
        periodo: periodo,
        registro: {
          id_CR: item.id_CR,
          codigo: item.Asignaturas.codigo,
          nombre: item.Asignaturas.nombre,
          uv: item.Asignaturas.uv,
          nota: item.nota,
          notaFinal: item.nota * item.Asignaturas.uv,
        }
      };
    });

    const groupedData = processedData.reduce((acc, item) => {
      if (!acc[item.anio]) {
        acc[item.anio] = { anio: item.anio, periodos: {} };
      }
      if (!acc[item.anio].periodos[item.periodo]) {
        acc[item.anio].periodos[item.periodo] = [];
      }
      acc[item.anio].periodos[item.periodo].push(item.registro);
      return acc;
    }, {});

    const result = Object.keys(groupedData).map(anio => ({
      anio: anio,
      periodos: groupedData[anio].periodos
    }));

    return {
      infoEstudiante: infoEstudiante,
      registros: result
    };
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
  getCertificacionVOAE,
  getCalificacionesGlobal,
  getCalificacionesPorPeriodo
};
