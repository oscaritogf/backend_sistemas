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

}

module.exports = Student;