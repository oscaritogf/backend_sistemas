// src/controllers/matricula/validarMatriculaController.js
const {
    obtenerEstudiantePorId,
    obtenerConfiguracionMatricula,
    obtenerHistorialCalificaciones,
    obtenerAdmision
  } = require('../../models/matricula/ValidarMatricula');
  
  const validarAdicionAsignatura = async (req, res) => {
    const { id_estudiante } = req.params;
  
    try {
      // Obtener información del estudiante
      const estudiante = await obtenerEstudiantePorId(id_estudiante);
      if (!estudiante) {
        return res.status(404).json({ message: 'Estudiante no encontrado' });
      }
  
      // Buscar en ConfiguracionMatricula el periodo correspondiente al índice del estudiante
      const configuracion = await obtenerConfiguracionMatricula(estudiante.indice_periodo);
      if (!configuracion) {
        return res.status(400).json({ message: 'No se encontró configuración para tu periodo' });
      }
  
      const ahora = new Date();
      let fechaMatricula;
      let mensaje;
  
      // Determinar la fecha de matrícula basada en el índice del estudiante
      if (estudiante.indice_periodo >= configuracion.indice_desdeMatri1 && estudiante.indice_periodo <= configuracion.indice_hastaMatri1) {
        fechaMatricula = new Date(configuracion.fecha_matri1);
      } else if (estudiante.indice_periodo >= configuracion.indice_desdeMatri2 && estudiante.indice_periodo <= configuracion.indice_hastaMatri2) {
        fechaMatricula = new Date(configuracion.fecha_matri2);
      } else if (estudiante.indice_periodo >= configuracion.indice_desdeMatri3 && estudiante.indice_periodo <= configuracion.indice_hastaMatri3) {
        fechaMatricula = new Date(configuracion.fecha_matri3);
      } else if (estudiante.indice_periodo >= configuracion.indice_desdeMatri4 && estudiante.indice_periodo <= configuracion.indice_hastaMatri4) {
        fechaMatricula = new Date(configuracion.fecha_matri4);
      } else if (estudiante.indice_periodo >= configuracion.indice_desdeMatri5 && estudiante.indice_periodo <= configuracion.indice_hastaMatri5) {
        fechaMatricula = new Date(configuracion.fecha_matri5);
      }
  
      // Verificar si es estudiante de primer ingreso
      const historialCalificaciones = await obtenerHistorialCalificaciones(id_estudiante);
      const admision = await obtenerAdmision(estudiante.dni);
  
      if (!historialCalificaciones && admision) {
        // Lógica para estudiantes de primer ingreso
        if (admision.nota1 >= configuracion.pIngreso_desdeMatri1 && admision.nota1 <= configuracion.pIngreso_hastaMatri1) {
          fechaMatricula = new Date(configuracion.fecha_matri1);
        } else if (admision.nota1 >= configuracion.pIngreso_desdeMatri2 && admision.nota1 <= configuracion.pIngreso_hastaMatri2) {
          fechaMatricula = new Date(configuracion.fecha_matri2);
        }
      }
  
      if (ahora < fechaMatricula) {
        const tiempoRestante = fechaMatricula.getTime() - ahora.getTime();
        const diasRestantes = Math.ceil(tiempoRestante / (1000 * 3600 * 24));
        const horasRestantes = Math.ceil(tiempoRestante / (1000 * 3600));
  
        mensaje = `No es tu fecha de matrícula. Tu matrícula está programada para el ${fechaMatricula.toLocaleDateString()}. Faltan ${diasRestantes} días o ${horasRestantes} horas.`;
        return res.status(200).json({ puedeMatricular: false, mensaje, fechaMatricula });
      }
  
      if (ahora > new Date(configuracion.fecha_finMatri)) {
        mensaje = 'Ya pasó la fecha para adicionar asignaturas';
        return res.status(400).json({ puedeMatricular: false, mensaje });
      }
  
      mensaje = 'Puedes adicionar asignaturas';
      return res.status(200).json({ puedeMatricular: true, mensaje });
  
    } catch (error) {
      console.error('Error al validar adición de asignatura:', error);
      res.status(500).json({ message: 'Error del servidor' });
    }
  };
  
  module.exports = {
    validarAdicionAsignatura,
  };