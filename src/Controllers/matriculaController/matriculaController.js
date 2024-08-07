
//src/controllers/matriculaController/matriculaController.js
// const supabase = require('../../config/supabase');
/*const supabase = require('../../config/supabase');
const { getDepartamentos, getAsignaturasByDepartamento, getSeccionesByAsignatura } = require('../../models/matricula/Matricula');


const {getDepartamentoEstudiante, getAsignaturasPorDepartamento, cancelarMatricula,
  listarAsignaturasMatriculadas, procesarListaEspera, listarEstudiantesEnEspera,
  listarClasesEnEspera} = require('../../models/matricula/Matricula');
const {getDepartamentoEstudiante, getAsignaturasPorDepartamento, cancelarMatricula,
  listarAsignaturasMatriculadas, procesarListaEspera, listarEstudiantesEnEspera,
  listarClasesEnEspera} = require('../../models/matricula/Matricula');

const {
 
  matricularAsignatura
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
  const { id_estudiante, id_seccion } = req.body;
  try {
    const resultado = await matricularAsignatura(id_estudiante, id_seccion);
    
    if (resultado.message === 'Matricula con exito') {
      res.json({ message: 'Matrícula realizada con éxito', data: resultado.data });
    } else if (resultado.message === 'Añadido a la lista de espera') {
      res.status(202).json({ message: 'Añadido a la lista de espera', data: resultado.data });
    } else {
      // En caso de que se devuelva un mensaje inesperado
      res.status(500).json({ error: 'Resultado inesperado de la matrícula' });
    }
  } catch (error) {
    if (error.message === 'Ya tiene esta asignatura matriculada') {
      res.status(400).json({ error: 'Ya tiene esta clase matriculada' });
    } else if (error.message === 'La sección no pertenece al departamento del estudiante') {
      res.status(400).json({ error: 'La sección no corresponde al departamento del estudiante' });
    } else if (error.message === 'Sección no encontrada') {
      res.status(404).json({ error: 'Sección no encontrada' });
    } else if (error.message === 'No cumple con los requisitos para matricular esta asignatura') {
      res.status(400).json({ error: 'No cumple con los requisitos para esta asignatura' });
    } else {
      res.status(500).json({ error: error.message });
    }
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
      .update({ Cupos: parseInt(nuevos_cupos) })
      .eq('id_Secciones', parseInt(id_seccion));

    if (error) throw error;

    await procesarListaEspera(parseInt(id_seccion));

    res.json({ message: 'Cupos actualizados y lista de espera procesada' });
  } catch (error) {
    console.error('Error al actualizar cupos:', error);
    res.status(500).json({ error: error.message });
  }
};

////listar y cancelar matricula

exports.cancelarMatricula = async (req, res) => {
  const { id_estudiante, id_seccion } = req.body;
  try {
    const resultado = await cancelarMatricula(id_estudiante, id_seccion);
    res.json(resultado);
  } catch (error) {
    if (error.message === 'Matrícula no encontrada') {
      res.status(404).json({ error: 'No se encontró la matrícula para cancelar' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
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


///listar estudiante de lista de espera
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
};*/

// src/controllers/matriculaController/matriculaController.js
const supabase = require('../../config/supabase');
const { 
  getDepartamentos, 
  getAsignaturasByDepartamento, 
  getSeccionesByAsignatura, 
  getDepartamentoEstudiante, 
  getAsignaturasPorDepartamento, 
  cancelarMatricula, 
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
  const { id_estudiante, id_seccion } = req.body;
  try {
    const resultado = await matricularAsignatura(id_estudiante, id_seccion);
    
    if (resultado.message === 'Matricula con éxito') {
      res.json({ message: 'Matrícula realizada con éxito', data: resultado.data });
    } else if (resultado.message === 'Añadido a la lista de espera') {
      res.status(202).json({ message: 'Añadido a la lista de espera', data: resultado.data });
    } else {
      res.status(500).json({ error: 'Resultado inesperado de la matrícula' });
    }
  } catch (error) {
    if (error.message === 'Ya tiene esta asignatura matriculada') {
      res.status(400).json({ error: 'Ya tiene esta clase matriculada' });
    } else if (error.message === 'La sección no pertenece al departamento del estudiante') {
      res.status(400).json({ error: 'La sección no corresponde al departamento del estudiante' });
    } else if (error.message === 'Sección no encontrada') {
      res.status(404).json({ error: 'Sección no encontrada' });
    } else if (error.message === 'La sección no pertenece al departamento del estudiante') {
      res.status(400).json({ error: 'La sección no corresponde al departamento del estudiante' });
    } else if (error.message === 'Sección no encontrada') {
      res.status(404).json({ error: 'Sección no encontrada' });
    } else if (error.message === 'No cumple con los requisitos para matricular esta asignatura') {
      res.status(400).json({ error: 'No cumple con los requisitos para esta asignatura' });
    } else {
      res.status(500).json({ error: error.message });
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
