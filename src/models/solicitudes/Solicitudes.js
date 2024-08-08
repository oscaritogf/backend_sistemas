
//src/models/solicitudes/Solicitudes.js
const supabase = require('../../config/supabase');


  const obtenerDepartamentos = async () => {
    try {
      const { data, error } = await supabase
        .from('Departamentos')
        .select('id_Departamento, Nombre')
        .order('Nombre');
  
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error al obtener departamentos:', error);
      throw error;
    }
  };

  const crearSolicitud = async (id_estudiante, id_tipo_solicitud, detalles, motivo_cancelacion = null, secciones_a_cancelar = null, documento_respaldo = null) => {
    try {
      // Obtener el departamento del estudiante
      const { data: estudianteData, error: estudianteError } = await supabase
        .from('estudiante')
        .select('id_Departamento')
        .eq('id', id_estudiante)
        .single();
  
      if (estudianteError) throw estudianteError;
      const id_departamento_actual = estudianteData.id_Departamento;
  
      // Obtener el ID del rol de coordinador
      const { data: rolData, error: rolError } = await supabase
        .from('rol')
        .select('id')
        .eq('nombre', 'Coordinador')
        .single();
  
      if (rolError) throw rolError;
      const id_rol_coordinador = rolData.id;
  
      // Obtener los IDs de usuarios con el rol de coordinador
      const { data: usuarioRolData, error: usuarioRolError } = await supabase
        .from('UsuarioRol')
        .select('id_Usuario')
        .eq('id_Rol', id_rol_coordinador);
  
      if (usuarioRolError) throw usuarioRolError;
  
      const ids_coordinadores = usuarioRolData.map(rol => rol.id_Usuario);
  
      // Obtener el coordinador del departamento actual del estudiante
      const { data: coordinadorData, error: coordinadorError } = await supabase
        .from('empleado')
        .select('numeroEmpleado')
        .eq('id_Departamento', id_departamento_actual)
        .in('usuario', ids_coordinadores)
        .limit(1)
        .single();
  
      if (coordinadorError) throw coordinadorError;
      if (!coordinadorData) throw new Error('No se encontró un coordinador para el departamento especificado');
      
      const id_coordinador = coordinadorData.numeroEmpleado;
  
      // Preparar los datos de la solicitud
      const solicitudData = {
        id_estudiante,
        id_tipo_solicitud,
        detalles,
        id_coordinador,
        estado: 'pendiente',
        fecha_solicitud: new Date(),
        motivo_cancelacion,
        secciones_a_cancelar
      };
  
      // Si hay un documento de respaldo, subirlo a Supabase Storage
      if (documento_respaldo) {
        const { data: fileData, error: fileError } = await supabase.storage
          .from('documentos')
          .upload(`solicitudes/${id_estudiante}_${Date.now()}.pdf`, documento_respaldo);
  
        if (fileError) throw fileError;
        solicitudData.documento_respaldo = fileData.path;
      }
  
      // Crear la solicitud
      const { data, error } = await supabase
        .from('solicitudes_estudiantes')
        .insert([solicitudData])
        .select();
  
      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Error al crear la solicitud:', error);
      throw error;
    }
  };
  
  
  
  



const obtenerSolicitudesEstudiante = async (id_estudiante) => {
  const { data, error } = await supabase
    .from('solicitudes_estudiantes')
    .select('*')
    .eq('id_estudiante', id_estudiante);

  if (error) throw error;
  return data;
};

const obtenerSolicitudesPendientes = async (id_coordinador) => {
    console.log('Buscando solicitudes pendientes para coordinador:', id_coordinador);
    const { data, error } = await supabase
      .from('solicitudes_estudiantes')
      .select('*')
      .eq('estado', 'pendiente')
      .eq('id_coordinador', id_coordinador);
  
    if (error) {
      console.error('Error al obtener solicitudes pendientes:', error);
      throw error;
    }
    
    console.log('Solicitudes pendientes encontradas:', data);
    return data;
  };
  
const responderSolicitud = async (id_solicitud, id_coordinador, respuesta, nuevo_estado) => {
  const { data, error } = await supabase
    .from('solicitudes_estudiantes')
    .update({ 
      id_coordinador, 
      respuesta, 
      estado: nuevo_estado,
      fecha_respuesta: new Date()
    })
    .eq('id', id_solicitud)
    .select();

  if (error) throw error;
  return data[0];
};



module.exports = {
  crearSolicitud,
  obtenerSolicitudesEstudiante,
  obtenerSolicitudesPendientes,
  responderSolicitud,
  obtenerDepartamentos,
};