
const supabase = require('../../config/supabase');
const {
    crearSolicitud,
    obtenerSolicitudesEstudiante,
    obtenerSolicitudesPendientes,
    responderSolicitud
  } = require('../../models/solicitudes/Solicitudes');

const multer = require('multer');
const path = require('path');

  // Configuración de multer para manejar la carga de archivos
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos PDF'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // Limita el tamaño del archivo a 5MB
  }
}).single('documento_respaldo');
/*
  exports.crearNuevaSolicitud = async (req, res) => {
    try {
      const { id_estudiante, id_tipo_solicitud, detalles, motivo_cancelacion, secciones_a_cancelar } = req.body;
      const documento_respaldo = req.file; // Asumiendo que estás usando multer para manejar la carga de archivos
  
      const solicitud = await crearSolicitud(
        id_estudiante, 
        id_tipo_solicitud, 
        detalles, 
        motivo_cancelacion, 
        secciones_a_cancelar, 
        documento_respaldo
      );
  
      res.status(201).json(solicitud);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
*/

exports.crearNuevaSolicitud = async (req, res) => {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
  
      try {
        const { id_estudiante, id_tipo_solicitud, detalles, motivo_cancelacion, secciones_a_cancelar } = req.body;
  
        // Obtener el nombre del tipo de solicitud
        const { data: tipoSolicitud, error: tipoError } = await supabase
          .from('tipo_solicitud')
          .select('nombre')
          .eq('id', id_tipo_solicitud)
          .single();
  
        if (tipoError) throw tipoError;
  
        // Validación para Cancelaciones excepcionales
        if (tipoSolicitud.nombre === 'Cancelaciones excepcionales') {
          if (!req.file) {
            return res.status(400).json({ error: 'Debe subir un PDF para solicitudes de Cancelaciones excepcionales' });
          }
          if (!motivo_cancelacion || !secciones_a_cancelar) {
            return res.status(400).json({ error: 'Debe proporcionar motivo de cancelación y secciones a cancelar' });
          }
        }
  
        const solicitud = await crearSolicitud(
          id_estudiante, 
          id_tipo_solicitud, 
          detalles, 
          motivo_cancelacion, 
          secciones_a_cancelar, 
          req.file ? req.file.buffer : null
        );
  
        res.status(201).json(solicitud);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  };

  
  exports.obtenerSolicitudesDeEstudiante = async (req, res) => {
    const { id_estudiante } = req.params;
    try {
      const solicitudes = await obtenerSolicitudesEstudiante(id_estudiante);
      res.json(solicitudes);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  
  exports.obtenerSolicitudesPendientesParaCoordinador = async (req, res) => {
    const { id_coordinador } = req.params;
    try {
      const solicitudes = await obtenerSolicitudesPendientes(id_coordinador);
      res.json(solicitudes);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  
  exports.responderASolicitud = async (req, res) => {
    const { id_solicitud } = req.params;
    const { id_coordinador, respuesta, nuevo_estado } = req.body;
    try {
      const solicitudActualizada = await responderSolicitud(id_solicitud, id_coordinador, respuesta, nuevo_estado);
      res.json(solicitudActualizada);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };