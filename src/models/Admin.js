
const supabase = require('../config/supabase');
const bcrypt = require('bcrypt');
const cloudinary = require('../config/cloudinary');
const { sendEmployeeWelcomeEmail } = require('../utils/emailService');

class Admin {
  

  // console.log('Prueba de conexión:', { data: testData, error: testError });

  //   const { nombre, apellido, correo, telefono, identidad, contrasena, imagen, roles } = empleadoData;

  //   // Generar número de empleado único
  //   const numeroEmpleado = await this.generateUniqueEmployeeNumber();

  //   // Hashear la contraseña
  //   const saltRounds = 10;
  //   const hashedPassword = await bcrypt.hash(contrasena, saltRounds);

  //   // Subir imagen a Cloudinary
  //   //let imageUrl = '';
  //   if (imagen) {
  //     const result = await cloudinary.uploader.upload(imagen);
  //     //imageUrl = result.secure_url;
      
  //   }

  //   // Iniciar transacción
  //   const { data: usuario, error: userError } = await supabase
  //     .from('Usuario')
  //     .insert({
  //       Nombre: nombre,
  //       Apellido: apellido,
  //       Correo: correo,
  //       Telefono: telefono,
  //       Identidad: identidad,
  //       Contrasena: hashedPassword,
  //       Imagen: imageUrl
  //     })
  //     .single();

  //   if (userError) {
  //       console.error('error al incertar datos', userError);
  //       throw userError;
  //   };
   
  //   if (!usuario) {
  //       console.error('Usuario es null después de la inserción. Respuesta de Supabase:', { data: usuario, error: userError });
  //       throw new Error('Fallo al crear el usuario');
  //     }
  //   const { data: empleado, error: empleadoError } = await supabase
  //     .from('empleado')
  //     .insert({
  //       numeroEmpleado,
  //       id_usuario: usuario.id
  //     })
  //     .single();

  //   if (empleadoError) throw empleadoError;

  //   // Asignar roles
  //   for (const rolNombre of roles) {
  //     const { data: rol, error: rolError } = await supabase
  //       .from('rol')
  //       .select('id')
  //       .eq('nombre', rolNombre)
  //       .single();

  //     if (rolError) throw rolError;

  //     if (rol) {
  //       const { error: userRolError } = await supabase
  //         .from('UsuarioRol')
  //         .insert({
  //           id_Usuario: usuario.id,
  //           id_Rol: rol.id
  //         });

  //       if (userRolError) throw userRolError;
  //     }
  //   }

  //   // Enviar correo con credenciales
  //   await this.sendWelcomeEmail(correo, nombre, numeroEmpleado, contrasena);

  //   return { ...usuario, numeroEmpleado, roles };
  // }*/



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
            usuario: usuario.id
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
    console.log('actualizando empleado :', numeroEmpleado);
    const { nombre, apellido, correo, telefono, identidad, contrasena, imagen, roles } = empleadoData;
  

    //primero, obtenemos el id del usuario basandonos en el numeroEmpleado
    const {data: empleado, error:empleadoError}=await supabase
    .from('empleado')
    .select('usuario')
    .eq('numeroEmpleado', numeroEmpleado)
    .single();

    if(empleadoError){
        console.error('Errol al buscar el empleado: ', empleadoError);
        throw new Error(`Error al buscar empleado: ${empleadoError.message}`)
    }

    if(!empleado){
        throw new Error(`Empleado con número ${numeroEmpleado} no encontrado`);
    }
    const userId = empleado.usuario;
    // Preparar los datos del usuario
    const userData = {
      Nombre: nombre,
      Apellido: apellido,
      Correo: correo,
      Telefono: telefono,
      Identidad: identidad
    };
  
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
  
    // Actualizar roles si se proporcionan
    if (roles && roles.length > 0) {
      // Primero, eliminar roles existentes
      const { error: deleteRolesError } = await supabase
        .from('UsuarioRol')
        .delete()
        .eq('id_Usuario', userId);
  
      if (deleteRolesError) {
        console.error('Error al eliminar roles existentes:', deleteRolesError);
        throw deleteRolesError;
      }
  
      // Luego, asignar nuevos roles
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
              id_Usuario: id,
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
  
    return { ...usuario, roles: updatedRoleNames };
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
