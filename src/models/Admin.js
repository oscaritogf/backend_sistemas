
const supabase = require('../config/supabase');
const bcrypt = require('bcrypt');
const cloudinary = require('../config/cloudinary');
const { sendConfirmationEmail } = require('../utils/emailService');

class Admin {
  
 /* static async createEmpleado(empleadoData) {
    console.log('Datos recibidos:', empleadoData);
    const { data: testData, error: testError } = await supabase
    .from('Usuario')
    .select('*')
    .limit(1);

  console.log('Prueba de conexión:', { data: testData, error: testError });

    const { nombre, apellido, correo, telefono, identidad, contrasena, imagen, roles } = empleadoData;

    // Generar número de empleado único
    const numeroEmpleado = await this.generateUniqueEmployeeNumber();

    // Hashear la contraseña
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(contrasena, saltRounds);

    // Subir imagen a Cloudinary
    //let imageUrl = '';
    if (imagen) {
      const result = await cloudinary.uploader.upload(imagen);
      //imageUrl = result.secure_url;
      
    }

    // Iniciar transacción
    const { data: usuario, error: userError } = await supabase
      .from('Usuario')
      .insert({
        Nombre: nombre,
        Apellido: apellido,
        Correo: correo,
        Telefono: telefono,
        Identidad: identidad,
        Contrasena: hashedPassword,
        Imagen: imageUrl
      })
      .single();

    if (userError) {
        console.error('error al incertar datos', userError);
        throw userError;
    };
   
    if (!usuario) {
        console.error('Usuario es null después de la inserción. Respuesta de Supabase:', { data: usuario, error: userError });
        throw new Error('Fallo al crear el usuario');
      }
    const { data: empleado, error: empleadoError } = await supabase
      .from('empleado')
      .insert({
        numeroEmpleado,
        id_usuario: usuario.id
      })
      .single();

    if (empleadoError) throw empleadoError;

    // Asignar roles
    for (const rolNombre of roles) {
      const { data: rol, error: rolError } = await supabase
        .from('rol')
        .select('id')
        .eq('nombre', rolNombre)
        .single();

      if (rolError) throw rolError;

      if (rol) {
        const { error: userRolError } = await supabase
          .from('UsuarioRol')
          .insert({
            id_Usuario: usuario.id,
            id_Rol: rol.id
          });

        if (userRolError) throw userRolError;
      }
    }

    // Enviar correo con credenciales
    await this.sendWelcomeEmail(correo, nombre, numeroEmpleado, contrasena);

    return { ...usuario, numeroEmpleado, roles };
  }*/



    static async createEmpleado(empleadoData) {
        console.log('Datos recibidos:', empleadoData);
        
        const { data: testData, error: testError } = await supabase
          .from('Usuario')
          .select('*')
          .limit(1);
      
        console.log('Prueba de conexión:', { data: testData, error: testError });
      
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
        try {
          await this.sendWelcomeEmail(correo, nombre, numeroEmpleado, contrasena);
        } catch (emailError) {
          console.error('Error al enviar email de bienvenida:', emailError);
          // Decide si quieres lanzar este error o simplemente loggearlo
        }
      
        return { ...usuario, numeroEmpleado, roles };
      }

 //actualizar un empleado
 
 static async updateEmpleado(numeroEmpleado, empleadoData) {
    const { Nombre, Apellido, Correo, Celefono, Identidad, roles } = empleadoData;
  
    // Primero, verificar si el empleado existe y obtener su id_Usuario
    const { data: empleado, error: fetchError } = await supabase
      .from('empleado')
      .select('usuario')
      .eq('numeroEmpleado', numeroEmpleado)
      .single();
  
    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        throw new Error('Empleado no encontrado');
      }
      throw fetchError;
    }
  
    if (!empleado) {
      throw new Error('Empleado no encontrado');
    }
  
    // Actualizar la información del usuario
    const { data: updatedUser, error: updateError } = await supabase
      .from('Usuario')
      .update({
        Nombre,
        Apellido,
        Correo,
        Telefono: Celefono,  // Asumiendo que 'Celefono' en el JSON corresponde a 'Telefono' en la base de datos
        Identidad
      })
      .eq('id', empleado.usuario)
      .single();
  
    if (updateError) throw updateError;
  
    // Actualizar roles si se proporcionaron
    if (roles && roles.length > 0) {
      // Eliminar roles existentes
      await supabase
        .from('UsuarioRol')
        .delete()
        .eq('id_Usuario', empleado.id_Usuario);
  
      // Obtener IDs de los nuevos roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('rol')
        .select('id, nombre')
        .in('nombre', roles);
  
      if (rolesError) throw rolesError;
  
      // Insertar nuevos roles
      const newUserRoles = rolesData.map(role => ({
        id_Usuario: empleado.id_Usuario,
        id_Rol: role.id
      }));
  
      const { error: insertRolesError } = await supabase
        .from('UsuarioRol')
        .insert(newUserRoles);
  
      if (insertRolesError) throw insertRolesError;
    }
  
    // Obtener el empleado actualizado con sus roles
    const { data: updatedEmpleado, error: finalFetchError } = await supabase
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
          Imagen
        ),
        Usuario (
          UsuarioRol (
            rol (nombre)
          )
        )
      `)
      .eq('numeroEmpleado', numeroEmpleado)
      .single();
  
    if (finalFetchError) throw finalFetchError;
  
    return {
      numeroEmpleado: updatedEmpleado.numeroEmpleado,
      id: updatedEmpleado.Usuario.id,
      Nombre: updatedEmpleado.Usuario.Nombre,
      Apellido: updatedEmpleado.Usuario.Apellido,
      Correo: updatedEmpleado.Usuario.Correo,
      Telefono: updatedEmpleado.Usuario.Telefono,
      Identidad: updatedEmpleado.Usuario.Identidad,
      Imagen: updatedEmpleado.Usuario.Imagen,
      roles: updatedEmpleado.Usuario.UsuarioRol.map(ur => ur.rol.nombre)
    };
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
