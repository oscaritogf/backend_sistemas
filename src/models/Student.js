const supabase = require('../config/supabase');
const bcrypt = require('bcrypt');
const cloudinary = require('../config/cloudinary');

class Student {

        static async updateProfile(id_Usuario, usuarioData) {
          const { Fotografia1, Fotografia2, Fotografia3, Descripcion, ...userData } = usuarioData;
          try {
              // Obtenemos los datos actuales del perfil
              const { data: currentData, error: fetchError } = await supabase
                  .from('Perfiles')
                  .select('*')
                  .eq('id_Usuario', id_Usuario)
                  .single();
  
              if (fetchError) {
                  throw fetchError;
              }
  
              // Subir nuevas imágenes a Cloudinary si se proporcionan
              const uploadToCloudinary = async (file) => {
                  const result = await cloudinary.uploader.upload(file.path);
                  return result.secure_url;
              };
  
              if (Fotografia1 && Fotografia1[0]) {
                  usuarioData.Fotografia1 = await uploadToCloudinary(Fotografia1[0]);
              }
              if (Fotografia2 && Fotografia2[0]) {
                  usuarioData.Fotografia2 = await uploadToCloudinary(Fotografia2[0]);
              }
              if (Fotografia3 && Fotografia3[0]) {
                  usuarioData.Fotografia3 = await uploadToCloudinary(Fotografia3[0]);
              }
  
              // Preparamos los datos para la actualización
              const updateData = {
                  ...currentData,
                  ...usuarioData,
              };
  
              // Actualizamos los datos del perfil
              const { data, error } = await supabase
                  .from('Perfiles')
                  .update(updateData)
                  .eq('id_Usuario', id_Usuario);
  
              if (error) {
                  throw error;
              }
  
              return data;
          } catch (error) {
              console.error('Error al actualizar el perfil:', error);
              return null;
          }
        }

        static async getProfile(id_Usuario) {
          try {
            // Realizamos la consulta combinada utilizando joins
            
            let { data, error } = await supabase
            .from('Usuario')
            .select('*, Perfiles(*), empleado(*, id_Centros(*), id_Departamento(*)), estudiante(*, id_Centros(*), id_Departamento(*))')
            .eq('id', id_Usuario)
            .single();
        
        
            return data;
          } catch (error) {
            console.error('Error al obtener el perfil:', error);
            return null;
          }
        }

      static async updateEstudiante(numeroCuenta, estudianteData) {
        try {
          const { Nombre, Apellido, correo_Institucional, Telefono, Identidad, Contrasena, Imagen, id_Centros, id_Departamento } = estudianteData;


          // Obtener el id del usuario basándonos en el numeroCuenta
          const { data: estudiante, error: estudianteError } = await supabase
            .from('estudiante')
            .select('usuario')
            .eq('numeroCuenta', numeroCuenta)
            .single();

          if (estudianteError) {
            console.error('Error al buscar el empleado:', estudianteError);
            throw new Error(`Error al buscar empleado: ${empleadoError.message}`);
          }

          if (!estudiante) {
            throw new Error(`Empleado con número ${numeroCuenta} no encontrado`);
          }

          const userId = estudiante.usuario;
          console.log('ID de usuario encontrado:', userId);

          // Preparar los datos del usuario
          const userData = {
            Nombre,
            Apellido,
            Telefono,
            Identidad
          };

          // Actualizar el correoInstitucional y el id_Centros del empleado si se proporcionan
          const estudianteUpdateData = {};
          if (id_Centros !== undefined) {
            estudianteUpdateData.id_Centros = id_Centros;
          }
          if (id_Departamento !== undefined) {
            estudianteUpdateData.id_Departamento = id_Departamento;
          }
          if (correo_Institucional) {
            estudianteUpdateData.correo_Institucional = correo_Institucional;
          }

          if (Object.keys(estudianteUpdateData).length > 0) {
            const { error: estudianteUpdateError } = await supabase
              .from('estudiante')
              .update(estudianteUpdateData)
              .eq('numeroCuenta', numeroCuenta);

            if (estudianteUpdateError) {
              console.error('Error al actualizar empleado:', estudianteUpdateError);
              throw estudianteUpdateError;
            }
          }
          
          // Si se proporciona una nueva contraseña, hashearla
          if (Contrasena) {
            const saltRounds = 10;
            userData.Contrasena = await bcrypt.hash(Contrasena, saltRounds);
          }

          // Subir nueva imagen a Cloudinary si se proporciona
          if (Imagen) {
            try {
              const result = await cloudinary.uploader.upload(Imagen.path);
              userData.Imagen = result.secure_url;
            } catch (cloudinaryError) {
              console.error('Error al subir imagen a Cloudinary:', cloudinaryError);
              // Decide si quieres lanzar este error o continuar sin actualizar la imagen
              throw cloudinaryError; // Lanza el error si necesitas manejarlo arriba
            }
          }

          console.log('Datos de usuario a actualizar:', userData);






          // Actualizar la imagen en cometChat
          const url = `https://${process.env.COMETCHAT_APP_ID}.api-us.cometchat.io/v3/users/${numeroCuenta}`; 
          const options = {
            method: 'PUT',
            headers: {
              accept: 'application/json',
              'content-type': 'application/json',
              apikey: process.env.COMETCHAT_API_KEY 
            },
            body: JSON.stringify({
              avatar: userData.Imagen
            })
          };

          fetch(url, options)
            .then(res => res.json())
            .then(json => console.log(json))
            .catch(err => console.error('error:' + err));






        // Verificar si el usuario existe antes de actualizar
          const { data: existingUser, error: existingUserError } = await supabase
            .from('Usuario')
            .select('id')
            .eq('id', userId)
            .single();

          if (existingUserError || !existingUser) {
            console.error('Usuario no encontrado:', userId);
            throw new Error('Usuario no encontrado');
          }


          // Actualizar usuario
          const { data: usuario, error: userError } = await supabase
            .from('Usuario')
            .update(userData)
            .eq('id', userId)
            .select()
            .single();

          if (userError) {
            console.error('Error al actualizar usuario:', userError);
            throw userError;
          }

          if (!usuario) {
            console.error('Usuario no encontrado para actualización');
            throw new Error('Fallo al actualizar el usuario');
          }

          console.log('Usuario actualizado exitosamente:', usuario);





          // Obtenemos los datos actuales del estudiante
          const { data: estudianteActualizado, error: fetchError } = await supabase
            .from('estudiante')
            .select('*')
            .eq('numeroCuenta', numeroCuenta)
            .single();
    
          if (fetchError) {
            throw fetchError;
          }
    

          return { ...usuario, 
            id_Centros: estudianteActualizado.id_Centros,
            id_Departamento: estudianteActualizado.id_Departamento
          }; 
        } catch (error) {
          console.error('Error en updateEmpleado:', error);
          throw error;
        }
      }


      static async encuestaDocente(id_Seccion, id_Estudiante, pregunta1, pregunta2, pregunta3, pregunta4, pregunta5) {
        try {
          // Verificar si ya existe una evaluación para este estudiante en la sección
          const { data: existingEncuesta, error: existingEncuestaError } = await supabase
            .from('evaluacion_docente')
            .select('id')
            .eq('id_Seccion', id_Seccion)
            .eq('id_Estudiante', id_Estudiante)
            .single();
      
          if (existingEncuestaError && existingEncuestaError.code !== 'PGRST116') { // 'PGRST116' es el código de error para "no hay resultados"
            console.error('Error al verificar encuesta existente:', existingEncuestaError);
            throw existingEncuestaError;
          }
      
          if (existingEncuesta) {
            return { message: 'Ya evaluaste al docente en esta sección' };
          }
      
          // Obtener información de la sección
          const { data: seccion, error: seccionError } = await supabase
            .from('Secciones')
            .select('codigoAsignatura, id_Departamento, id_Docentes')
            .eq('id_Secciones', id_Seccion)
            .single();
      
          if (seccionError) {
            console.error('Error al obtener información de la sección:', seccionError);
            throw seccionError;
          }
      
          // Insertar la nueva evaluación
          const { data: encuesta, error: encuestaError } = await supabase
            .from('evaluacion_docente')
            .insert({
              id_Docente: seccion.id_Docentes,
              id_Seccion: id_Seccion,
              id_Estudiante: id_Estudiante,
              pregunta1: pregunta1,
              pregunta2: pregunta2,
              pregunta3: pregunta3,
              pregunta4: pregunta4,
              pregunta5: pregunta5,
              codigo_Asignatura: seccion.codigoAsignatura,
              id_Departamento: seccion.id_Departamento
            });
      
          if (encuestaError) {
            console.error('Error al insertar encuesta:', encuestaError);
            throw encuestaError;
          }
      
          return { message: 'Encuesta registrada con éxito' };
        } catch (error) {
          console.error('Error en encuestaDocente:', error);
          throw error;
        }
      }
      
      static async notasEstudiante(id_Seccion, id_Estudiante) {
        try {
          // Verificar si existe una evaluación docente para el estudiante y la sección
          const { data: evaluacion, error: evaluacionError } = await supabase
            .from('evaluacion_docente')
            .select('id')
            .eq('id_Seccion', id_Seccion)
            .eq('id_Estudiante', id_Estudiante)
            .single();
      
          if (evaluacionError && evaluacionError.code !== 'PGRST116') { // 'PGRST116' es el código de error para "no hay resultados"
            console.error('Error al verificar evaluación docente:', evaluacionError);
            throw evaluacionError;
          }
      
          if (!evaluacion) {
            return { message: 'evalua al docente' };
          }
      
          // Si existe la evaluación, obtener las notas
          const { data: notas, error: notasError } = await supabase
            .from('Calificaciones_Registro')
            .select('*')
            .eq('id_Seccion', id_Seccion)
            .eq('id_Estudiante', id_Estudiante)
            .limit(1); // Usa limit en lugar de single
      
          if (notasError) {
            console.error('Error al obtener notas:', notasError);
            throw notasError;
          }
      
          if (!notas || notas.length === 0) {
            return { message: 'No se encontraron notas para este estudiante en esta sección' };
          }
      
          return notas[0]; // Retorna la primera nota si existe
        } catch (error) {
          console.error('Error en notasEstudiante:', error);
          throw error;
        }
      }

      
      static async notasEstudiante(id_Seccion, id_Estudiante) {
        try {
          // Verificar si existe una evaluación docente para el estudiante y la sección
          const { data: evaluacion, error: evaluacionError } = await supabase
            .from('evaluacion_docente')
            .select('id')
            .eq('id_Seccion', id_Seccion)
            .eq('id_Estudiante', id_Estudiante)
            .single();
      
          if (evaluacionError && evaluacionError.code !== 'PGRST116') { // 'PGRST116' es el código de error para "no hay resultados"
            console.error('Error al verificar evaluación docente:', evaluacionError);
            throw evaluacionError;
          }
      
          if (!evaluacion) {
            return { message: 'evalua al docente' };
          }
      
          // Si existe la evaluación, obtener las notas
          const { data: notas, error: notasError } = await supabase
            .from('Calificaciones_Registro')
            .select('*')
            .eq('id_Seccion', id_Seccion)
            .eq('id_Estudiante', id_Estudiante)
            .limit(1); // Usa limit en lugar de single
      
          if (notasError) {
            console.error('Error al obtener notas:', notasError);
            throw notasError;
          }
      
          if (!notas || notas.length === 0) {
            return { message: 'No se encontraron notas para este estudiante en esta sección' };
          }
      
          return notas[0]; // Retorna la primera nota si existe
        } catch (error) {
          console.error('Error en notasEstudiante:', error);
          throw error;
        }
      }
            

}

module.exports = Student;