// controllers/adminController.js
const Admin = require('../models/Admin');
const supabase = require('../config/supabase');
exports.createEmpleado = async (req, res) => {
  try {
    const empleadoData = {
      ...req.body,
      imagen: req.file ? req.file : null 
    };//mejorado

    // Convertir roles de string a array es necesario
    if (typeof empleadoData.roles === 'string') {
      empleadoData.roles = JSON.parse(empleadoData.roles);
    }//nuevo 

    // Validar roles e id_Centros
    if (!empleadoData.roles || empleadoData.roles.length === 0) {
      return res.status(400).json({ message: 'Debe especificar al menos un rol para el empleado' });
    }
    if (!empleadoData.id_Centros) {
      return res.status(400).json({ message: 'Debe especificar el centro al que pertenece el empleado' });
    }

    const newEmpleado = await Admin.createEmpleado(empleadoData);

    res.status(201).json({ message: 'Empleado creado exitosamente', empleado: newEmpleado });
  } catch (error) {
    console.error('Error al crear empleado:', error);
    res.status(500).json({ message: 'Error al crear empleado', error: error.message });
  }
};

exports.getCentros = async (req, res) => {
  try {
    const { data: centros, error } = await supabase
      .from('Centros')
      .select('id_Centros, Nombre');

    if (error) {
      throw error;
    }

    res.status(200).json(centros);
  } catch (error) {
    console.error('Error al obtener los centros:', error);
    res.status(500).json({ message: 'Error al obtener los centros' });
  }
};


exports.updateEmpleado = async (req, res) => {
  try {
    const numeroEmpleado = parseInt(req.params.numeroEmpleado, 10);
    //const { numeroEmpleado } = req.params;
    console.log('el numero de empleado es: ',numeroEmpleado)

    if(isNaN(numeroEmpleado)){
      return res.status(404).json({ message:'numero de empleado invalido'});
    }
    // const empleadoData = req.body;
    const empleadoData = {
      ...req.body,
      imagen: req.file ? req.file : null 
    };

    // Convertir roles de string a array es necesario
    if (typeof empleadoData.roles === 'string') {
      empleadoData.roles = JSON.parse(empleadoData.roles);
    }//nuevo 
    
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

exports.getNoticias = async (req, res) => {
  try {
    const noticias = await Admin.getNoticias();
    res.json(noticias);
  } catch (error) {
    console.error('Error al obtener noticias:', error);
    res.status(500).json({ message: 'Error al obtener noticias', error: error.message });
  }
};


exports.createNoticia = async (req, res) => {
  try {
    // req.file contiene la información del archivo subido por multer y req.body contiene solo los datos de texto del formulario
    const noticiaData = { ...req.body, imagen: req.file };
    const noticia = await Admin.createNoticia(noticiaData);
    res.json(noticia);
  } catch (error) {
    console.error('Error al crear noticia:', error);
    res.status(500).json({ message: 'Error al crear noticia', error: error.message });
  }
};


exports.updateNoticia = async (req, res) => {
  try {
    console.log('Datos recibidos:', req.body); // Agrega este log para verificar los datos

    const idNoticia = req.params.id_noticia;
    const noticiaData = req.body;

    const updatedNoticia = await Admin.updateNoticia(idNoticia, noticiaData);

    if (!updatedNoticia) {
      return res.status(404).json({ message: 'Noticia no encontrada' });
    }

    res.json({
      message: 'Noticia actualizada exitosamente',
      noticia: updatedNoticia
    });
  } catch (error) {
    console.error('Error al actualizar noticia:', error);
    res.status(500).json({
      message: 'Error al actualizar noticia',
      error: error.message
    });
  }
};

exports.createCancelacion = async (req, res) => {
  try {
    const nuevaCancelacion = await Admin.createCancelacion(req.body);
    res.status(201).json(nuevaCancelacion);
  } catch (error) {
    console.log('Error al crear la cancelacion:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.deleteNoticia = async (req, res) => {
  try {
    const idNoticia = req.params.id_noticia;

    await Admin.deleteNoticia(idNoticia);

    res.json({
      message: 'Noticia eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar noticia:', error);
    res.status(500).json({
      message: 'Error al eliminar noticia',
      error: error.message
    });
  }
};
exports.getPac = async (req, res) => {
  try {
    const pac = await Admin.getPac();
    res.json(pac);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.getTipoMatricula = async (req, res) => {
  try {
    const matricula = await Admin.getTipoMatricula();
    res.json(matricula);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

///Controlador para configurar matricul 
exports.crearConfiguracion = async (req, res) => {
  try {
    const nuevaConfiguracion = await Admin.createConfiguracion(req.body);
    res.status(201).json(nuevaConfiguracion);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
//funciona
exports.obtenerConfiguraciones = async (req, res) => {
  try {
    const configuraciones = await Admin.getConfiguraciones();
    res.json(configuraciones);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
//funciona
exports.obtenerConfiguracionPorId = async (req, res) => {
  try {
    const configuracion = await Admin.getConfiguracionById(req.params.id);
    if (configuracion) {
      res.status(200).json(configuracion);
    } else {
      res.status(404).json({ message: 'Configuración no encontrada' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.actualizarConfiguracion = async (req, res) => {
  try {
    const configuracionActualizada = await Admin.updateConfiguracion(req.params.id, req.body);
    if (configuracionActualizada) {
      res.status(200).json(configuracionActualizada);
    } else {
      res.status(404).json({ message: 'Configuración no encontrada' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.eliminarConfiguracion = async (req, res) => {
  try {
    const deleted = await Admin.deleteConfiguracion(req.params.id);
    if (deleted) {
      res.status(204).send();
    } else {
      res.status(404).json({ message: 'Configuración no encontrada' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
