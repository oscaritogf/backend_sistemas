
const supabase = require('../config/supabase');
const bcrypt = require('bcrypt');
const cloudinary = require('../config/cloudinary');
const { sendEmployeeWelcomeEmail } = require('../utils/emailService');

class Admin {
  



    static async createEmpleado(empleadoData) {
       
        const { nombre, apellido, correo, telefono, identidad, contrasena, imagen, roles } = empleadoData;
      
        // Generar número de empleado único
        const numeroEmpleado = await this.generateUniqueEmployeeNumber();
      
        // Hashear la contraseña
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(contrasena, saltRounds);
      
        // Preparar los datos del usuario
        const userData = {
          Nombre: nombre,
          Apellido: apellido,
          Correo: correo,
          Telefono: telefono,
          Identidad: identidad,
          Contrasena: hashedPassword
        };
      
        // Subir imagen a Cloudinary si se proporciona
        if (imagen) {
          try {
            const result = await cloudinary.uploader.upload(imagen);
            userData.Imagen = result.secure_url;
          } catch (cloudinaryError) {
            console.error('Error al subir imagen a Cloudinary:', cloudinaryError);
            // Decide si quieres lanzar este error o continuar sin imagen
          }
        }
      
        // Insertar usuario
        const { data: usuario, error: userError } = await supabase
          .from('Usuario')
          .insert(userData)
          .select()
          .single();
      
        if (userError) {
          console.error('Error al insertar usuario:', userError);
          throw userError;
        }
      
        if (!usuario) {
          console.error('Usuario es null después de la inserción');
          throw new Error('Fallo al crear el usuario');
        }
      
        // Insertar empleado
        const { data: empleado, error: empleadoError } = await supabase
          .from('empleado')
          .insert({
            numeroEmpleado,
            usuario: usuario.id,

            //estado
            estado: true,
          })
          .select()
          .single();
      
        if (empleadoError) {
          console.error('Error al insertar empleado:', empleadoError);
          throw empleadoError;
        }
      
        // Asignar roles
        for (const rolNombre of roles) {
          const { data: rol, error: rolError } = await supabase
            .from('rol')
            .select('id')
            .eq('nombre', rolNombre)
            .single();
      
          if (rolError) {
            console.error(`Error al buscar rol ${rolNombre}:`, rolError);
            throw rolError;
          }
      
          if (rol) {
            const { error: userRolError } = await supabase
              .from('UsuarioRol')
              .insert({
                id_Usuario: usuario.id,
                id_Rol: rol.id
              });
      
            if (userRolError) {
              console.error(`Error al asignar rol ${rolNombre}:`, userRolError);
              throw userRolError;
            }
          } else {
            console.warn(`Rol no encontrado: ${rolNombre}`);
          }
        }
      
        // Enviar correo con credenciales
        await sendEmployeeWelcomeEmail(correo, nombre, numeroEmpleado, contrasena);
      
        return { ...usuario, numeroEmpleado, roles };
      }

 //actualizar un empleado
 static async updateEmpleado(numeroEmpleado, empleadoData) {
  console.log('Datos recibidos para actualización:', empleadoData);
  console.log('Actualizando empleado:', numeroEmpleado);
  const { nombre, apellido, correo, telefono, identidad, contrasena, imagen, roles, estado } = empleadoData;

  try {
    // Obtener el id del usuario basándonos en el numeroEmpleado
    const { data: empleado, error: empleadoError } = await supabase
      .from('empleado')
      .select('usuario')
      .eq('numeroEmpleado', numeroEmpleado)
      .single();

    if (empleadoError) {
      console.error('Error al buscar el empleado:', empleadoError);
      throw new Error(`Error al buscar empleado: ${empleadoError.message}`);
    }

    if (!empleado) {
      throw new Error(`Empleado con número ${numeroEmpleado} no encontrado`);
    }

    const userId = empleado.usuario;
    console.log('ID de usuario encontrado:', userId);

    // Preparar los datos del usuario
    const userData = {
      Nombre: nombre,
      Apellido: apellido,
      Correo: correo,
      Telefono: telefono,
      Identidad: identidad
    };
      //  Actualizar el estado del empleado si se proporciona
      if (estado !== undefined) {
        const { error: empleadoUpdateError } = await supabase
          .from('empleado')
          .update({ estado })
          .eq('numeroEmpleado', numeroEmpleado);
  
        if (empleadoUpdateError) {
          console.error('Error al actualizar estado del empleado:', empleadoUpdateError);
          throw empleadoUpdateError;
        }
      }

    // Si se proporciona una nueva contraseña, hashearla
    if (contrasena) {
      const saltRounds = 10;
      userData.Contrasena = await bcrypt.hash(contrasena, saltRounds);
    }

    // Subir nueva imagen a Cloudinary si se proporciona
    if (imagen) {
      try {
        const result = await cloudinary.uploader.upload(imagen);
        userData.Imagen = result.secure_url;
      } catch (cloudinaryError) {
        console.error('Error al subir imagen a Cloudinary:', cloudinaryError);
        // Decide si quieres lanzar este error o continuar sin actualizar la imagen
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

    // Actualizar roles si se proporcionan
    if (roles && roles.length > 0) {
      console.log('Actualizando roles:', roles);
      
      // Obtener roles actuales del usuario
      const { data: currentRoles, error: currentRolesError } = await supabase
        .from('UsuarioRol')
        .select('rol(id, nombre)')
        .eq('id_Usuario', userId);
    
      if (currentRolesError) {
        console.error('Error al obtener roles actuales:', currentRolesError);
        throw currentRolesError;
      }
    
      console.log('Roles actuales:', currentRoles);

      const currentRoleNames = currentRoles.map(r => r.rol.nombre);
      const rolesToAdd = roles.filter(r => !currentRoleNames.includes(r));
      const rolesToRemove = currentRoleNames.filter(r => !roles.includes(r));
      
      console.log('Roles a agregar:', rolesToAdd);
      console.log('Roles a eliminar:', rolesToRemove);

      // Agregar nuevos roles
      for (const rolNombre of rolesToAdd) {
        const { data: rol, error: rolError } = await supabase
          .from('rol')
          .select('id')
          .eq('nombre', rolNombre)
          .single();

        if (rolError) {
          console.error(`Error al buscar rol ${rolNombre}:`, rolError);
          throw rolError;
        }
        
        if (rol) {
          const { error: userRolError } = await supabase
            .from('UsuarioRol')
            .insert({
              id_Usuario: userId,
              id_Rol: rol.id
            });
    
          if (userRolError) {
            console.error(`Error al asignar rol ${rolNombre}:`, userRolError);
            throw userRolError;
          }
          console.log(`Rol ${rolNombre} agregado con éxito`);
        } else {
          console.warn(`Rol no encontrado: ${rolNombre}`);
        }
      }

      // Eliminar roles que ya no se necesitan
      for (const rolNombre of rolesToRemove) {
        const rolToRemove = currentRoles.find(r => r.rol.nombre === rolNombre);
        if (rolToRemove) {
          const { error: deleteRolError } = await supabase
            .from('UsuarioRol')
            .delete()
            .eq('id_Usuario', userId)
            .eq('id_Rol', rolToRemove.rol.id);

          if (deleteRolError) {
            console.error(`Error al eliminar rol ${rolNombre}:`, deleteRolError);
            throw deleteRolError;
          }
          console.log(`Rol ${rolNombre} eliminado con éxito`);
        }
      }

      console.log('Actualización de roles completada');
    }

    // Obtener roles actualizados
    const { data: updatedRoles, error: rolesError } = await supabase
      .from('UsuarioRol')
      .select('rol(nombre)')
      .eq('id_Usuario', userId);

    if (rolesError) {
      console.error('Error al obtener roles actualizados:', rolesError);
      throw rolesError;
    }

    const updatedRoleNames = updatedRoles.map(r => r.rol.nombre);
    console.log('Roles actualizados:', updatedRoleNames);

    // Incluir el estado en la respuesta
    const { data: empleadoActualizado, error: empleadosError } = await supabase
      .from('empleado')
      .select('estado')
      .eq('numeroEmpleado', numeroEmpleado)
      .single();

    if (empleadosError) {
      console.error('Error al obtener estado actualizado del empleado:', empleadoError);
      throw empleadoError;
    }


    return { ...usuario, roles: updatedRoleNames, estado: empleadoActualizado.estado }; 
  } catch (error) {
    console.error('Error en updateEmpleado:', error);
    throw error;
  }
}

  
    //aqui listo los empleados 
  static async listEmpleados() {
    const { data: empleados, error } = await supabase
      .from('empleado')
      .select(`
        numeroEmpleado,
        Usuario (
          id, 
          Nombre, 
          Apellido, 
          Correo, 
          Telefono, 
          Identidad, 
          Imagen,
          UsuarioRol (
            rol (nombre)
          )
        )
      `);
  
    if (error) throw error;
  
    return empleados.map(empleado => ({
      numeroEmpleado: empleado.numeroEmpleado,
      id: empleado.Usuario.id,
      Nombre: empleado.Usuario.Nombre,
      Apellido: empleado.Usuario.Apellido,
      Correo: empleado.Usuario.Correo,
      Telefono: empleado.Usuario.Telefono,
      Identidad: empleado.Usuario.Identidad,
      Imagen: empleado.Usuario.Imagen,
      roles: empleado.Usuario.UsuarioRol.map(ur => ur.rol.nombre)
    }));
  }

static async generateUniqueEmployeeNumber() {
  const currentYear = new Date().getFullYear();
  let uniqueNumber;
  let isUnique = false;

  while (!isUnique) {
    const randomNum = Math.floor(Math.random() * 9999) + 1;
    uniqueNumber = `${currentYear}${randomNum.toString().padStart(4, '0')}`;

    // Verificar si el número ya existe
    const { data, error } = await supabase
      .from('empleado')
      .select('numeroEmpleado')
      .eq('numeroEmpleado', uniqueNumber);

    if (error) throw error;
    if (data.length === 0) isUnique = true;
  }

  return uniqueNumber;
}

  static async sendWelcomeEmail(correo, nombre, numeroEmpleado, contrasena) {
    try {
      await sendConfirmationEmail(correo, nombre, numeroEmpleado, contrasena);
    } catch (error) {
      console.error('Error al enviar correo de bienvenida:', error);
      throw error;
    }
  }

  
    static async getRoles() {
      const { data: roles, error } = await supabase
        .from('rol')
        .select('id, nombre');
  
      if (error) {
        throw new Error('Error al obtener roles');
      }
  
      return roles;
    }

    static async getNoticias() {
      let { data: noticias, error } = await supabase
      .from('noticias')
      .select('*');
      if (error) {
        console.error('Error al obtener noticias:', error);
        throw new Error('Error al obtener noticias');
      }
      return noticias;
    };

    static async createNoticia(noticiaData) {
      console.log('Datos recibidos:', noticiaData);
      let imageUrl = '';
      if (noticiaData.imagen) {
        try {
          const result = await cloudinary.uploader.upload(noticiaData.imagen.path);
          imageUrl = result.secure_url;
        } catch (cloudinaryError) {
          console.error('Error al subir imagen a Cloudinary:', cloudinaryError);
        }
      }
      const { data, error } = await supabase
        .from('noticias')
        .insert({ ...noticiaData, imagen: imageUrl })
        .single();
      if (error) {
        throw new Error('Error al crear noticia');
      }
      return data;
    };
}

module.exports = Admin;
