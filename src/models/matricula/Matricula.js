//src/models/matricula/Matricula.js',
const supabase = require('../../config/supabase');

const getDepartamentos = async () => {
    const { data, error } = await supabase
      .from('Departamentos')
      .select('*');
    
    if (error) throw error;
    return data;
  };

  const getAsignaturasByDepartamento = async (id_Departamento) => {
    const { data, error } = await supabase
      .from('Asignaturas')
      .select('*')
      .eq('id_Departamento', id_Departamento);
    
    if (error) throw error;
    return data;
  };

///lista las secciones por asignatura
  const getSeccionesByAsignatura = async (codigo) => {
    const { data: secciones, error: errorSecciones } = await supabase
      .from('Secciones')
      .select(`
        id_Secciones,
        id_Aula,
        id_Edificios,
        Hora_inicio,
        Hora_Final,
        Cupos,
        Justificacion,
        codigoAsignatura,
        id_Departamento,
        seccion_dias (
          id_dia,
          Dias (
            Nombre
          )
        )
      `)
      .eq('codigoAsignatura', codigo)
      .eq('estado',true);
  
    if (errorSecciones) throw errorSecciones;
  
    // Obtener todas las matriculas de estas secciones
    const { data: matriculas, error: errorMatriculas } = await supabase
      .from('matricula')
      .select('id_seccion');
  
    if (errorMatriculas) throw errorMatriculas;
  
    // Calcular cupos disponibles
    const matriculasPorSeccion = matriculas.reduce((acc, { id_seccion }) => {
      acc[id_seccion] = (acc[id_seccion] || 0) + 1;
      return acc;
    }, {});
  
    const seccionesConCuposDisponibles = secciones.map(seccion => {
      const cuposMatriculados = matriculasPorSeccion[seccion.id_Secciones] || 0;
      return {
        ...seccion,
        cuposDisponibles: seccion.Cupos - cuposMatriculados
      };
    });
  
    return seccionesConCuposDisponibles;
  };
  

  ///traer los docentes por seccion para msotrar el nombre 

  const getDocenteInfo = async (id_seccion) => {
    if (!id_seccion) {
      throw new Error('Section ID is required');
    }
  
    // Obtenemos el id_Docentes de la tabla Secciones
    const { data: seccionData, error: seccionError } = await supabase
      .from('Secciones')
      .select('id_Docentes')
      .eq('id_Secciones', id_seccion)
      .single();
  
    if (seccionError) {
      throw new Error(`Error retrieving section: ${seccionError.message}`);
    }
  
    if (!seccionData || !seccionData.id_Docentes) { 
      throw new Error('Section not found or has no assigned docente');
    }
  
    const idDocente = seccionData.id_Docentes;
  
    // Obtenemos el usuario asociado con el id_Docentes de la tabla empleado
    const { data: empleadoData, error: empleadoError } = await supabase
      .from('empleado')
      .select('numeroEmpleado, usuario')
      .eq('numeroEmpleado', idDocente);
  
    if (empleadoError) {
        throw new Error(`Error retrieving empleado: ${empleadoError.message}`);
    }
  
    if (!empleadoData || empleadoData.length === 0) {
      throw new Error(`No empleado found with id: ${idDocente}`);
    }
  
    const idUsuario = empleadoData[0].usuario;
  
    if (!idUsuario) {
      throw new Error(`Empleado with id ${idDocente} has no associated usuario`);
    }
    
    // Obtenemos el nombre y apellido del usuario de la tabla Usuario
    const { data: usuarioData, error: usuarioError } = await supabase
      .from('Usuario')
      .select('Nombre, Apellido')
      .eq('id', idUsuario)
      .single();
  
    if (usuarioError) {
      throw new Error(`Error retrieving usuario: ${usuarioError.message}`);
    }
  
    if (!usuarioData) {
      throw new Error(`No usuario found with id: ${idUsuario}`);
    }
  
  
    return {
      nombre: usuarioData.Nombre,
      apellido: usuarioData.Apellido
    };
  };
  

  const getIdEstudiante = async (id_user) => {
    if (!id_user) {
      throw new Error('User ID is required');
    }
  
    const { data, error } = await supabase
      .from('estudiante')
      .select('id')
      .eq('usuario', id_user)
      .single();
  
    if (error) {
      throw new Error(`Error retrieving student: ${error.message}`);
    }
  
    if (!data) {
      throw new Error('Student not found');
    }
  
    return data.id;
  };
  
  
  const getDepartamentoEstudiante = async (id_estudiante) => {
    const { data, error } = await supabase
      .from('estudiante')
      .select('id_Departamento')
      .eq('id', id_estudiante)
      .single(); // suponer que 'id' es el identificador único del estudiante
    
    if (error) throw error;
    return data.id_Departamento;
  };

  const getAsignaturasPorDepartamento = async (id_departamento) => {
    const { data, error } = await supabase
      .from('Asignaturas')
      .select('codigo, nombre, uv')
      .eq('id_Departamento', id_departamento);
    
    if (error) throw error;
    return data;
  };

  const getSeccionById = async (id_seccion) => {
    const { data, error } = await supabase
      .from('Secciones')
      .select(`
        *,
        Asignaturas (
          nombre,
          id_Departamento
        ),
        Aula (
          id_Edificio
        ),
        Edificios (
          id_Centros
        )
      `)
      .eq('id_Secciones', id_seccion)
      .single();
  
    if (error) throw error;
    return data;
  };

  const verificarPertenenciaDepartamento = (seccion, id_Departamento) => {
    return seccion.id_Departamento === id_Departamento;
  };

  ///

  /*const verificarRequisitos = async (id_estudiante, codigo_asignatura) => {
    // Obtener los requisitos de la asignatura
    const { data: requisitos, error: reqError } = await supabase
      .from('requisitos_asignaturas')
      .select('requisito_codigo')
      .eq('asignatura_codigo', codigo_asignatura);
  
    if (reqError) throw reqError;
  
    // Verificar si el estudiante ha aprobado todos los requisitos
    for (const req of requisitos) {
      const { data: aprobado, error: aprobadoError } = await supabase
        .from('historial_academico') // Asume que existe una tabla con el historial académico
        .select('*')
        .eq('id_estudiante', id_estudiante)
        .eq('codigo_asignatura', req.requisito_codigo)
        .gte('nota', 65) // Asume que 65 es la nota mínima para aprobar
        .single();
  
      if (aprobadoError) throw aprobadoError;
      if (!aprobado) return false;
    }
  
    return true;
  };*/

 const verificarMatriculaExistente = async (id_estudiante, codigoAsignatura) => {
  const { data, error } = await supabase
    .from('matricula')
    .select('*')
    .eq('id_estudiante', id_estudiante)
    .eq('codigoAsignatura', codigoAsignatura)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return !!data;
};
 
//verifica los cupos disponibles

const verificarCuposDisponibles = async (id_seccion) => {
  const { data, error } = await supabase
    .from('Secciones')
    .select('Cupos')
    .eq('id_Secciones', id_seccion)
    .single();

  if (error) throw error;

  const { count, error: countError } = await supabase
    .from('matricula')
    .select('id_matricula', { count: 'exact' })
    .eq('id_seccion', id_seccion);

  if (countError) throw countError;

  return data.Cupos > count;
};

const agregarAListaEspera = async (id_estudiante, id_seccion) => {
  const { data, error } = await supabase
    .from('lista_espera')
    .insert([{ id_estudiante, id_seccion }])
    .select();

  if (error) {
    if (error.code === '23505') { // Código de error para violación de unicidad
      throw new Error('Ya estás en la lista de espera para esta sección');
    }
    throw error;
  }

  return data;
};


const verificarRequisitos = async (id_estudiante, codigo_asignatura) => {
  const { data: requisitos, error: errorRequisitos } = await supabase
    .from('requisitos_asignaturas')
    .select('requisito_codigo')
    .eq('asignatura_codigo', codigo_asignatura);

  if (errorRequisitos) throw errorRequisitos;

  for (let requisito of requisitos) {
    const { data: matricula, error: errorMatricula } = await supabase
      .from('matricula')
      .select('codigoAsignatura')
      .eq('id_estudiante', id_estudiante)
      .eq('codigoAsignatura', requisito.requisito_codigo);

    if (errorMatricula) throw errorMatricula;

    if (matricula.length === 0) {
      return false; // No cumple con un requisito
    }
  }

  return true; // Cumple con todos los requisitos
};


const matricularAsignatura = async (id_estudiante, id_seccion, codigo_asignatura) => {
  // Obtener información del estudiante
  const { data: estudiante, error: errorEstudiante } = await supabase
    .from('estudiante')
    .select('id_Departamento')
    .eq('id', id_estudiante)
    .single();

  if (errorEstudiante) throw errorEstudiante;

  const cumpleRequisitos = await verificarRequisitos(id_estudiante, codigo_asignatura);
  if (!cumpleRequisitos) {
    throw new Error('No cumple con los requisitos para matricular esta asignatura');
  }

  // Obtener información de la sección
  const seccion = await getSeccionById(id_seccion);
  if (!seccion) {
    throw new Error('Sección no encontrada');
  }

  // Permitir matriculación en asignaturas de servicios de otros departamentos
  if (seccion.id_Departamento !== estudiante.id_Departamento) {
    const { data: esServicio, error: errorServicio } = await supabase
      .from('asignaturas_servicio')
      .select('codigo_asignatura')
      .eq('codigo_asignatura', codigo_asignatura)
      .single();

    if (errorServicio) throw errorServicio;

    if (!esServicio) {
      throw new Error('La sección no pertenece a tu departamento y no es un servicio permitido');
    }
  }

  // Verificar si ya está matriculado
  const yaMatriculada = await verificarMatriculaExistente(id_estudiante, seccion.codigoAsignatura);
  if (yaMatriculada) {
    throw new Error('Ya tiene esta asignatura matriculada');
  }

  // Verificar cupos disponibles
  const hayCupos = await verificarCuposDisponibles(id_seccion);
  if (!hayCupos) {
    return await agregarAListaEspera(id_estudiante, id_seccion);
  }

  // Obtener los días de la semana de la nueva sección
  const { data: diasNuevaSeccion, error: errorDiasNuevaSeccion } = await supabase
    .from('seccion_dias')
    .select('id_dia')
    .eq('id_seccion', id_seccion);

  if (errorDiasNuevaSeccion) throw errorDiasNuevaSeccion;

  // Obtener las secciones en las que el estudiante ya está matriculado
  const { data: seccionesMatriculadas, error: errorSeccionesMatriculadas } = await supabase
    .from('matricula')
    .select(`
      Secciones (
        id_Secciones,
        Hora_inicio,
        Hora_Final
      )
    `)
    .eq('id_estudiante', id_estudiante);

  if (errorSeccionesMatriculadas) throw errorSeccionesMatriculadas;

  // Verificar si hay traslape de horarios y días
  for (let seccionMatriculada of seccionesMatriculadas) {
    const { data: diasSeccionMatriculada, error: errorDiasSeccionMatriculada } = await supabase
      .from('seccion_dias')
      .select('id_dia')
      .eq('id_seccion', seccionMatriculada.Secciones.id_Secciones);

    if (errorDiasSeccionMatriculada) throw errorDiasSeccionMatriculada;

    const diasSeccionMatriculadaIds = diasSeccionMatriculada.map(dia => dia.id_dia);

    for (let diaNuevaSeccion of diasNuevaSeccion) {
      if (diasSeccionMatriculadaIds.includes(diaNuevaSeccion.id_dia)) {
        if (
          (seccion.Hora_inicio < seccionMatriculada.Secciones.Hora_Final && seccion.Hora_inicio >= seccionMatriculada.Secciones.Hora_inicio) ||
          (seccion.Hora_Final > seccionMatriculada.Secciones.Hora_inicio && seccion.Hora_Final <= seccionMatriculada.Secciones.Hora_Final)
        ) {
          throw new Error('Hay un traslape de horarios con otra asignatura ya matriculada');
        }
      }
    }
  }

  // Realizar la matrícula
  const { data, error } = await supabase
    .from('matricula')
    .insert([
      {
        id_estudiante,
        id_seccion,
        codigoAsignatura: seccion.codigoAsignatura,
        fecha: new Date()
      }
    ])
    .select();

  if (error) throw error;
  return { message: 'Matrícula con éxito', data: data[0] };
};


  const procesarListaEspera = async (id_seccion) => {
    const hayQuapos = await verificarCuposDisponibles(id_seccion);
    if (!hayQuapos) return;
  
    const { data: siguienteEnEspera, error } = await supabase
      .from('lista_espera')
      .select('*')
      .eq('id_seccion', id_seccion)
      .order('fecha_solicitud', { ascending: true })
      .limit(1)
      .single();
  
    if (error) throw error;
    if (!siguienteEnEspera) return;
  
    await matricularAsignatura(siguienteEnEspera.id_estudiante, id_seccion);
  
    await supabase
      .from('lista_espera')
      .delete()
      .match({ id: siguienteEnEspera.id });
  };
  

  ///listar y cancelar asignaturas 
const cancelarMatricula = async (id_estudiante, id_seccion) => {
    const { data, error } = await supabase
      .from('matricula')
      .delete()
      .match({ id_estudiante, id_seccion });
  
    if (error) throw error;
    if (data && data.length === 0) {
      throw new Error('Matrícula no encontrada');
    }
    return { message: 'Matrícula cancelada con éxito' };
  };
 
  const cancelarMatriculaEnEspera = async (id_estudiante, id_seccion) => {
    const { data, error } = await supabase
      .from('lista_espera')
      .delete()
      .eq('id_estudiante', id_estudiante)
      .eq('id_seccion', id_seccion);

    if (error) throw error;
    if (data && data.length === 0) {
      throw new Error('No estás en la lista de espera para esta sección');
    }
    return { message: 'Matrícula cancelada con éxito' };
  };


const listarAsignaturasMatriculadas = async (id_usuario) => {
  // Obtén el id_estudiante a partir del id_usuario
  const { data: estudiante, error: errorEstudiante } = await supabase
    .from('estudiante')
    .select('id')
    .eq('usuario', id_usuario)
    .single();

  if (errorEstudiante) throw errorEstudiante;
  
  const { data, error } = await supabase
    .from('matricula')
    .select(`
      *,
      Secciones (
        id_Secciones,
        Hora_inicio,
        Hora_Final,
        Cupos,
        Asignaturas (
          nombre,
          codigo,
          uv
        ), 
        Edificios(
          Nombre
        ),
        Aula(
          Nombre
        ),
        Dias:seccion_dias!inner(
          Dia:Dias (
            Nombre
          )
        )
      )
    `)
    .eq('id_estudiante', estudiante.id);

  if (error) throw error;
  return data;
};

exports.listarAsignaturasMatriculadas = async (req, res) => {
  const { id_estudiante } = req.params;
  try {
    const asignaturas = await listarAsignaturasMatriculadas(id_estudiante);
    res.json(asignaturas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


  const listarEstudiantesEnEspera = async (id_seccion) => {
    const { data, error } = await supabase
      .from('lista_espera')
      .select(`
        id,
        id_estudiante,
        fecha,
        estudiante:id_estudiante (
          id,
          usuario(Nombre,
          Apellido),
          
          numeroCuenta
        )
      `)
      .eq('id_seccion', id_seccion)
      .order('fecha', { ascending: true });
  
    if (error) throw error;
    return data;
  };



  const listarClasesEnEspera = async (id_estudiante) => {
    const { data, error } = await supabase
      .from('lista_espera')
      .select(`
        id,
        id_seccion,
        fecha_solicitud,
        Secciones:id_seccion (
          id_Secciones,
          Hora_inicio,
          Hora_Final,
          Asignaturas (
            nombre,
            codigo,
            uv
          )
        )
      `)
      .eq('id_estudiante', id_estudiante)
      .order('fecha_solicitud', { ascending: true });
  
    if (error) throw error;
    return data;
  };

  module.exports = {

    verificarRequisitos,
    verificarMatriculaExistente,
    matricularAsignatura,
    getDepartamentos,
    getAsignaturasByDepartamento,
    getSeccionesByAsignatura,
    
    getDepartamentoEstudiante,
    getAsignaturasPorDepartamento,
    getSeccionById,

    cancelarMatricula,
    cancelarMatriculaEnEspera,
    listarAsignaturasMatriculadas,

   
   procesarListaEspera,

   listarEstudiantesEnEspera,
   listarClasesEnEspera,

   getIdEstudiante,

   getDocenteInfo,
  
  };