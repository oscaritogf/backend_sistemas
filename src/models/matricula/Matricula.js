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

  const getSeccionesByAsignatura = async (codigo) => {
    const { data, error } = await supabase
      .from('Secciones')
      .select(`
        *,
        Asignaturas (
          codigo
        )
      `)
      .eq('codigoAsignatura', codigo);
    
    if (error) throw error;
    return data;
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

  const verificarRequisitos = async (id_estudiante, codigo_asignatura) => {
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
  };


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

     // Verificar que la sección pertenece al mismo departamento que el estudiante
  if (!verificarPertenenciaDepartamento(seccion, estudiante.id_Departamento)) {
    throw new Error('La sección no pertenece al departamento del estudiante');
  }

    // Verificar si ya está matriculado
  const yaMatriculada = await verificarMatriculaExistente(id_estudiante, seccion.codigoAsignatura);
  if (yaMatriculada) {
    throw new Error('Ya tiene esta asignatura matriculada');
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
  ]);
  
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
  };