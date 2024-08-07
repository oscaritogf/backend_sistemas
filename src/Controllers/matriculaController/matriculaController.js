// src/controllers/matriculaController/matriculaController.js
const supabase = require('../../config/supabase');
const { 
  getDepartamentos, 
  getAsignaturasByDepartamento, 
  getSeccionesByAsignatura, 
  getDepartamentoEstudiante, 
  getAsignaturasPorDepartamento, 
  cancelarMatricula, 
  cancelarMatriculaEnEspera,
  listarAsignaturasMatriculadas, 
  procesarListaEspera, 
  listarEstudiantesEnEspera, 
  listarClasesEnEspera, 
  matricularAsignatura,
  getIdEstudiante,
  getDocenteInfo,
} = require('../../models/matricula/Matricula');

exports.getDepartamentos = async (req, res) => {
  try {
    const departamentos = await getDepartamentos();
    res.json(departamentos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAsignaturasByDepartamento = async (req, res) => {
  const { id_Departamento } = req.params;
  try {
    const asignaturas = await getAsignaturasByDepartamento(id_Departamento);
    res.json(asignaturas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.getSeccionesByAsignatura = async (req, res) => {
  const { codigo } = req.params;
  try {
    const secciones = await getSeccionesByAsignatura(codigo);
    res.json(secciones);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getDocenteInfo = async (req, res) => {
  const { id_seccion } = req.params;

  if (!id_seccion) {
    return res.status(400).json({ message: 'Section ID is required' });
  }

  try {
    const docenteInfo = await getDocenteInfo(id_seccion);
    res.json(docenteInfo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};





exports.getIdEstudiante = async (req, res) => {
  const { id_user } = req.params;

  if (!id_user) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  try {
    const id = await getIdEstudiante(id_user);
    res.json({ id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



exports.getAsignaturasEstudiante = async (req, res) => {
  const { id_estudiante } = req.params;
  try {
    const id_departamento = await getDepartamentoEstudiante(id_estudiante);
    const asignaturas = await getAsignaturasPorDepartamento(id_departamento);
    res.json(asignaturas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.matricular = async (req, res) => {
  const { id_estudiante, id_seccion, codigo_asignatura } = req.body;
  try {
    const resultado = await matricularAsignatura(id_estudiante, id_seccion, codigo_asignatura);

    if (resultado.message === 'Matrícula con éxito') {
      res.json({ message: 'Matrícula realizada con éxito', data: resultado.data });
    } else if (resultado.message === 'Añadido a la lista de espera') {
      res.status(202).json({ message: 'Añadido a la lista de espera', data: resultado.data });
    } else {
      res.status(500).json({ error: 'Resultado inesperado de la matrícula' });
    }
  } catch (error) {
    if (error.message === 'Ya tiene esta asignatura matriculada') {
      res.status(400).json({ error: 'Ya tiene esta clase matriculada' });
    } else if (error.message === 'La sección no pertenece a tu departamento y no es un servicio permitido') {
      res.status(400).json({ error: 'La sección no corresponde al departamento del estudiante ni es un servicio permitido' });
    } else if (error.message === 'Sección no encontrada') {
      res.status(404).json({ error: 'Sección no encontrada' });
    } else if (error.message === 'No cumple con los requisitos para matricular esta asignatura') {
      res.status(400).json({ error: 'El estudiante no cumple con los requisitos para matricular esta asignatura' });
    } else if (error.message === 'Ya en lista de espera') {
      res.status(400).json({ error: 'Ya está en la lista de espera para esta sección' });
    } else if (error.message === 'Hay un traslape de horarios con otra asignatura ya matriculada') {
      res.status(400).json({ error: 'Hay un traslape de horarios con otra asignatura ya matriculada' });
    } else {
      res.status(500).json({ error: 'Error inesperado en la matrícula', details: error.message });
    }
  }
};

exports.cancelarMatricula = async (req, res) => {
  const { id_estudiante, id_seccion } = req.body;
  try {
    const resultado = await cancelarMatricula(id_estudiante, id_seccion);
    res.json(resultado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.cancelarMatriculaEnEspera = async (req, res) => {
  const { id_estudiante, id_seccion } = req.body;
  try {
    const resultado = await cancelarMatriculaEnEspera(id_estudiante, id_seccion);
    res.json(resultado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

exports.listarAsignaturasMatriculadas = async (req, res) => {
  const { id_estudiante} = req.params;
  try {
    const asignaturas = await listarAsignaturasMatriculadas(id_estudiante);
    res.json(asignaturas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.listarEstudiantesEnEspera = async (req, res) => {
  const { id_seccion } = req.params;
  try {
    const estudiantes = await listarEstudiantesEnEspera(id_seccion);
    res.json(estudiantes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.listarClasesEnEspera = async (req, res) => {
  const { id_estudiante } = req.params;
  try {
    const clases = await listarClasesEnEspera(id_estudiante);
    res.json(clases);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.actualizarCupos = async (req, res) => {
  const { id_seccion } = req.params;
  const { nuevos_cupos } = req.body;
  
  if (!id_seccion || !nuevos_cupos) {
    return res.status(400).json({ error: 'Se requiere id_seccion y nuevos_cupos' });
  }

  try {
    const { data, error } = await supabase
      .from('Secciones')
      .update({ Cupos: nuevos_cupos })
      .eq('id_Secciones', id_seccion)
      .select();

    if (error) throw error;

    // Después de actualizar los cupos, procesar la lista de espera
    await procesarListaEspera(id_seccion);

    res.json({ message: 'Cupos actualizados y lista de espera procesada', data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
