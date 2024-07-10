// controllers/adminController.js
const Admin = require('../models/Admin');

exports.createEmpleado = async (req, res) => {
  
  try {
    const empleadoData = req.body;
    if (!empleadoData.roles || empleadoData.roles.length === 0) {
      return res.status(400).json({ message: 'Debe especificar al menos un rol para el empleado' });
    }
    const newEmpleado = await Admin.createEmpleado(empleadoData);
    res.status(201).json({ message: 'Empleado creado exitosamente', empleado: newEmpleado });
  } catch (error) {
    console.error('Error al crear empleado:', error);
    res.status(500).json({ message: 'Error al crear empleado', error: error.message });
  }
};

exports.updateEmpleado = async (req, res) => {
  try {
    const { numeroEmpleado } = req.params;
    const empleadoData = req.body;
    const updatedEmpleado = await Admin.updateEmpleado(numeroEmpleado, empleadoData);
    res.json({ message: 'Empleado actualizado exitosamente', empleado: updatedEmpleado });
  } catch (error) {
    console.error('Error al actualizar empleado:', error);
    res.status(500).json({ message: 'Error al actualizar empleado', error: error.message });
  }
};

exports.getRoles = async (req, res) => {
  try {
    const roles = await Admin.getRoles();
    res.json({ roles });
  } catch (error) {
    console.error('Error al obtener roles:', error);
    res.status(500).json({ message: 'Error al obtener roles', error: error.message });
  }
};

exports.listEmpleados = async (req, res) => {
  try {
    const empleados = await Admin.listEmpleados();
    res.json(empleados);
  } catch (error) {
    console.error('Error al listar empleados:', error);
    res.status(500).json({ message: 'Error al listar empleados', error: error.message });
  }
};