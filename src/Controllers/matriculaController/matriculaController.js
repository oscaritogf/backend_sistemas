
//src/controllers/matriculaController/matriculaController.js

const { getDepartamentos, getAsignaturasByDepartamento, getSeccionesByAsignatura } = require('../../models/matricula/Matricula');


const {getDepartamentoEstudiante, getAsignaturasPorDepartamento} = require('../../models/matricula/Matricula');

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
  const { id_estudiante, id_seccion, codigo_asignatura } = req.body;
  try {
    const resultado = await matricularAsignatura(id_estudiante, id_seccion, codigo_asignatura);
    res.json({ message: 'Matrícula realizada con éxito', data: resultado });
  } catch (error) {
    if (error.message === 'Ya tiene esta asignatura matriculada') {
      res.status(400).json({ error: 'Ya tiene esta clase matriculada' });
    } else if (error.message === 'No cumple con los requisitos para matricular esta asignatura') {
      res.status(400).json({ error: 'No cumple con los requisitos para esta asignatura' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
};