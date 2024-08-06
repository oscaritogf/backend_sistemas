
const supabase = require('../config/supabase');
const bcrypt = require('bcrypt');
const cloudinary = require('../config/cloudinary');
// const { sendEmployeeWelcomeEmail, sendEmailtoEmployee } = require('../utils/emailService');

const nodemailer = require('nodemailer');
require('dotenv').config();


const transporter = nodemailer.createTransport({
  service: 'gmail',  
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  debug: true,
  logger: true
});

class Admin {
  



  static async createEmpleado(empleadoData) {
    const { nombre, apellido, correo, telefono, identidad, contrasena, imagen, roles, id_Centros, id_Departamento } = empleadoData;
  
    // Verificar si el número de identidad ya existe
    const { data: existingUser, error: existingUserError } = await supabase
      .from('Usuario')
      .select('id')
      .eq('Identidad', identidad);
  
    if (existingUserError) {
      console.error('Error al verificar la existencia del número de identidad:', existingUserError);
      throw existingUserError;
    }
  
    if (existingUser.length > 0) {
      throw new Error('El número de identidad ya existe. No se puede crear el empleado.');
    }
  
    // Verificar si ya existe un coordinador o jefeDepartamento para el departamento
    const { data: empleados, error: empleadosError } = await supabase
      .from('empleado')
      .select(`
        numeroEmpleado,
        Usuario (
          id,
          Nombre,
          Apellido,
          UsuarioRol (
            rol (nombre)
          )
        )
      `)
      .eq('id_Centros', id_Centros)
      .eq('id_Departamento', id_Departamento);

    if (empleadosError) {
      console.error('Error al obtener empleados:', empleadosError);
      throw empleadosError;
    }

    // Extraer los nombres de roles de los empleados existentes en el departamento
    const existingRoles = empleados.flatMap(emp => emp.Usuario.UsuarioRol.map(ur => ({ 
      numeroEmpleado: emp.numeroEmpleado,
      role: ur.rol.nombre, 
      userId: emp.Usuario.id, 
      nombre: emp.Usuario.Nombre, 
      apellido: emp.Usuario.Apellido 
    })));

    // Verificar si ya existen Coordinador o JefeDepartamento en el departamento
    for (const role of roles) {
      if (role === 'Coordinador') {
        const existingCoordinator = existingRoles.find(r => r.role === 'Coordinador');
        if (existingCoordinator) {
          throw new Error(`Ya existe un Coordinador en este Centro: ${existingCoordinator.numeroEmpleado} ${existingCoordinator.nombre} ${existingCoordinator.apellido}`);
        }
      }
      if (role === 'JefeDepartamento') {
        const existingJefeDepartamento = existingRoles.find(r => r.role === 'JefeDepartamento');
        if (existingJefeDepartamento) {
          throw new Error(`Ya existe un Jefe de Departamento en este Centro: ${existingJefeDepartamento.numeroEmpleado} ${existingJefeDepartamento.nombre} ${existingJefeDepartamento.apellido}`);
        }
      }
    }

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
        // `imagen` debería ser el archivo de la imagen recibido en la solicitud
        const result = await cloudinary.uploader.upload(imagen.path);
        userData.Imagen = result.secure_url;
      } catch (cloudinaryError) {
        console.error('Error al subir imagen a Cloudinary:', cloudinaryError);
        // Decide si quieres lanzar este error o continuar sin imagen
        throw cloudinaryError; // Lanza el error si necesitas manejarlo arriba
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
        estado: true,
        id_Centros: id_Centros,
        id_Departamento: id_Departamento
      })
      .select()
      .single();
  
    if (empleadoError) {
      console.error('Error al insertar empleado:', empleadoError);
      throw empleadoError;
    }
  
    if (!empleado) {
      console.error('Empleado es null después de la inserción');
      throw new Error('Fallo al crear el empleado');
    }
  
    // Asignar roles
    for (const rolNombre of roles) {
      const { data: rol, error: rolError } = await supabase
        .from('rol')
        .select('id')
        .eq('nombre', rolNombre)
        .single(); // Asegura que se obtenga un solo resultado
  
      if (rolError) {
        console.error(`Error al buscar rol ${rolNombre}:`, rolError);
        throw rolError;
      }
  
      if (!rol) {
        console.error(`Rol no encontrado: ${rolNombre}`);
        throw new Error(`Rol no encontrado: ${rolNombre}`);
      }
  
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
    }

    const { data:perfil, error:perfilError } = await supabase
    .from('Perfiles')
    .insert({
      id_Usuario: usuario.id,
      Fotografia1: userData.Imagen
    })

    await this.crearUsuarioParaCometChat(numeroEmpleado, `${nombre} ${apellido}`);
    console.log('Empleado creado en cometchat: ', nombre, apellido);

   

    const sendEmployeeWelcomeEmail = async (to, nombre, numeroEmpleado, contrasena) => {
      try {
        await transporter.sendMail({
          from: '"Recursos Humanos Universidad" <garcia152511@gmail.com>',
          to: to,
          subject: "Bienvenido - Credenciales de acceso",
          html: `
            <h1>¡Bienvenido ${nombre}!</h1>
            <p>Has sido registrado exitosamente como empleado en nuestro sistema.</p>
            <p>Tus credenciales de acceso son:</p>
            <ul>
              <li>Número de empleado: ${numeroEmpleado}</li>
              <li>Contraseña: ${contrasena}</li>
            </ul>
            <p>Por favor, cambia tu contraseña después del primer inicio de sesión.</p>
            <p>Si tienes alguna pregunta, no dudes en contactar al departamento de Recursos Humanos.</p>
          `
        });
        console.log('Correo de bienvenida enviado al nuevo empleado');
      } catch (error) {
        console.error('Error al enviar correo de bienvenida al empleado:', error);
        throw error;
     }
    };
    

    try{
    // Enviar correo con credenciales
    await sendEmployeeWelcomeEmail(correo, `${nombre} ${apellido}`, numeroEmpleado, contrasena);
    } catch (error) {
      console.log('Error al enviar correo de bienvenida:', error);
      throw error;
    }
    return { ...usuario, numeroEmpleado, roles, id_Centros, id_Departamento };
  }

 //actualizar un empleado
 static async updateEmpleado(numeroEmpleado, empleadoData) {
  console.log('Datos recibidos para actualización:', empleadoData);
  console.log('Actualizando empleado:', numeroEmpleado);
  const { nombre, apellido, correo, telefono, identidad, contrasena, imagen, roles=[], estado, id_Centros, id_Departamento } = empleadoData;

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
 

        // Actualizar el estado y el id_Centros del empleado si se proporcionan
    const empleadoUpdateData = {};
    if (estado !== undefined) {
      empleadoUpdateData.estado = estado;
    }
    if (id_Centros !== undefined) {
      empleadoUpdateData.id_Centros = id_Centros;
    }
    if (id_Departamento !== undefined) {
      empleadoUpdateData.id_Departamento = id_Departamento;
    }

    if (Object.keys(empleadoUpdateData).length > 0) {
      const { error: empleadoUpdateError } = await supabase
        .from('empleado')
        .update(empleadoUpdateData)
        .eq('numeroEmpleado', numeroEmpleado);

      if (empleadoUpdateError) {
        console.error('Error al actualizar empleado:', empleadoUpdateError);
        throw empleadoUpdateError;
      }
    }


    // Verificar si ya existe un coordinador o jefeDepartamento para el departamento
    if (id_Departamento !== undefined && id_Centros !== undefined) {
      const { data: empleados, error: error } = await supabase
        .from('empleado')
        .select(`
          numeroEmpleado,
          Usuario (
            id,
            Nombre,
            Apellido,
            UsuarioRol (
              rol (nombre)
            )
          )
        `)
        .eq('id_Departamento', id_Departamento)
        .eq('id_Centros', id_Centros);

      if (error) {
        console.error('Error al obtener empleados:', error);
        throw error;
      }

      // Extraer los nombres de roles de los empleados existentes en el departamento
      const existingRoles = empleados.flatMap(emp => emp.Usuario.UsuarioRol.map(ur => ({ 
        numeroEmpleado: emp.numeroEmpleado,
        role: ur.rol.nombre, 
        userId: emp.Usuario.id, 
        nombre: emp.Usuario.Nombre, 
        apellido: emp.Usuario.Apellido 
      })));

      // Verificar si ya existen Coordinador o JefeDepartamento en el departamento, excepto para el empleado actual
      for (const role of roles) {
        if (role === 'Coordinador') {
          const existingCoordinator = existingRoles.find(r => r.role === 'Coordinador' && r.numeroEmpleado !== numeroEmpleado);
          if (existingCoordinator) {
            throw new Error(`Ya existe un Coordinador en este Centro: ${existingCoordinator.numeroEmpleado} ${existingCoordinator.nombre} ${existingCoordinator.apellido}`);
          }
        }
        if (role === 'JefeDepartamento') {
          const existingJefeDepartamento = existingRoles.find(r => r.role === 'JefeDepartamento' && r.numeroEmpleado !== numeroEmpleado);
          if (existingJefeDepartamento) {
            throw new Error(`Ya existe un Jefe de Departamento en este Centro: ${existingJefeDepartamento.numeroEmpleado} ${existingJefeDepartamento.nombre} ${existingJefeDepartamento.apellido}`);
          }
        }
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
        const result = await cloudinary.uploader.upload(imagen.path);
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



    // Actualizar la imagen en cometChat
    const url = `https://${process.env.COMETCHAT_APP_ID}.api-us.cometchat.io/v3/users/${numeroEmpleado}`; 
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
      .select('estado, id_Centros, id_Departamento')
      .eq('numeroEmpleado', numeroEmpleado)
      .single();

    if (empleadosError) {
      console.error('Error al obtener estado actualizado del empleado:', empleadoError);
      throw empleadoError;
    }


    return { ...usuario, 
      roles: updatedRoleNames, 
      estado: empleadoActualizado.estado,
      id_Centros: empleadoActualizado.id_Centros,
      id_Departamento: empleadoActualizado.id_Departamento
    }; 
  } catch (error) {
    console.error('Error en updateEmpleado:', error);
    throw error;
  }
}


  static async getDepartamentos() {
    const { data, error } = await supabase
      .from('Departamentos')
      .select(`
        id_Departamento,
        Nombre,
        id_Facultad,
        Facultades:id_Facultad (
          id_Facultad,
          nombre
        )
      `);
    if (error) {
      console.error('error al obtener los departamentos', error);
      throw error;
    }
    return data.map(departamento => ({
      id_Departamento: departamento.id_Departamento,
      Nombre: departamento.Nombre,
      Facultad: {
        facultad: departamento.Facultades.nombre,
        id_Facultad: departamento.Facultades.id_Facultad,
      }
    }));
  }
  
    //aqui listo los empleados 
  static async listEmpleados(incluirInactivos = false) {
    let query = supabase
   // const { data: empleados, error } = await supabase
      .from('empleado')
      .select(`
        numeroEmpleado,
        estado, 
        created_at,
        id_Centros,
        Centros (
          Nombre
        ),  
        id_Departamento,
        Departamentos (
          Nombre
        ),
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
      `)
      .order('created_at', { ascending: false });
    const {data: empleados, error}= await query;

    if (error) throw error;
  
    return empleados.map(empleado => ({
      numeroEmpleado: empleado.numeroEmpleado,
      fechaCreacion: empleado.created_at,
      id: empleado.Usuario.id,
      Nombre: empleado.Usuario.Nombre,
      Apellido: empleado.Usuario.Apellido,
      Correo: empleado.Usuario.Correo,
      Telefono: empleado.Usuario.Telefono,
      Identidad: empleado.Usuario.Identidad,
      Imagen: empleado.Usuario.Imagen,
      roles: empleado.Usuario.UsuarioRol.map(ur => ur.rol.nombre),
      estado: empleado.estado, //incluir estadi en el objeto
      Centro: empleado.Centros.Nombre,
      CentroId: empleado.id_Centros,
      DepartamentoId: empleado.id_Departamento,
      Departamento: empleado.Departamentos.Nombre
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
    .select('*')
    .order('fecha_creacion', { ascending: false });
    
    if (error) {
      console.error('Error al obtener noticias:', error);
      throw new Error('Error al obtener noticias');
    }
    return noticias;
  };
   // obtiene la informacion de la tabla GestionMatricula
    static async getGestionMatricula(){
    let {data:matricula, error}= await supabase
    .from('ConfiguracionMatricula')
    .select('*')
      if (error) {
        console.error('Error al obtener matriucla:', error);
        throw new Error('Error al obtener matricula');
      }
      return matricula;
   }
 // obtiene la informacion de la tabla GestionMatricula filtrada
   static async getGestionMatriculaFiltro(id){
    let {data:matricula, error}= await supabase
    .from('ConfiguracionMatricula')
    .select(`
      id_ConfMatri,
      created_at,
      id_Pac,
      id_TipoMatricula,
      fecha_inicioPAC,
      fecha_finPAC,
      fecha_inicioMatri,
      fecha_finMatri,
      hora_inicioMatri,
      hora_finMatri,
      fecha_matri1,
      indice_desdeMatri1,
      indice_hastaMatri1,
      pIngreso_desdeMatri1,
      pIngreso_hastaMatri1,
      fecha_matri2,
      indice_desdeMatri2,
      indice_hastaMatri2,
      pIngreso_desdeMatri2,
      pIngreso_hastaMatri2,
      fecha_matri3,
      indice_desdeMatri3,
      indice_hastaMatri3,
      fecha_matri4,
      indice_desdeMatri4,
      indice_hastaMatri4,
      fecha_matri5,
      indice_desdeMatri5,
      indice_hastaMatri5
      `)
      .eq('id_ConfMatri', id)
      .single();
      if (error) {
        console.error('Error al obtener matriucla:', error);
        throw new Error('Error al obtener matricula');
      }
      return matricula;
   }


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

  static async deleteNoticia(id) {
    try {
      // Verificar que la noticia con el id exista
      const { data: existingNoticia, error: selectError } = await supabase
        .from('noticias')
        .select('id_noticia')
        .eq('id_noticia', id)
        .single();

      if (selectError) {
        console.error('Error al verificar noticia:', selectError);
        throw new Error('No existe la noticia con el id proporcionado');
      }

      if (!existingNoticia) {
        console.error('Noticia no encontrada');
        throw new Error('Noticia no encontrada');
      }

      // Eliminar la noticia
      const { error: deleteError } = await supabase
        .from('noticias')
        .delete()
        .eq('id_noticia', id);

      if (deleteError) {
        console.error('Error al eliminar noticia:', deleteError);
        throw new Error('Error al eliminar noticia');
      }

      return { message: 'Noticia eliminada exitosamente' };
    } catch (error) {
      console.error('Error en deleteNoticia:', error);
      throw error;
    }
  }
  static async updateNoticia(id, noticiaData) {
    const { titulo, descripcion, imagen } = noticiaData;
  
    try {
      // Verificar que la noticia con el id exista
      const { data: existingNoticia, error: selectError } = await supabase
        .from('noticias')
        .select('id_noticia')
        .eq('id_noticia', id)
        .single();
  
      if (selectError) {
        console.error('Error al verificar noticia:', selectError);
        throw new Error('Error al verificar noticia');
      }
  
      if (!existingNoticia) {
        console.error('Noticia no encontrada');
        throw new Error('Noticia no encontrada');
      }
  
      console.log('Imagen recibida:', imagen);  // Log para verificar la imagen recibida
  
      // Si se proporciona una nueva imagen, subirla a Cloudinary
      if (imagen && typeof imagen === 'string' && imagen.startsWith('data:image')) {
        try {
          const result = await cloudinary.uploader.upload(imagen);
          noticiaData.imagen = result.secure_url;  // Actualizar la URL de la imagen en noticiaData
          console.log('URL de la imagen subida:', noticiaData.imagen);  // Log para verificar la URL de la imagen
        } catch (cloudinaryError) {
          console.error('Error al subir imagen a Cloudinary:', cloudinaryError);
          throw new Error('Error al subir imagen a Cloudinary');
        }
      } else {
        console.log('No se proporciona una nueva imagen o la imagen no es válida');
      }
  
      // Actualizar la noticia
      const { data, error: updateError } = await supabase
        .from('noticias')
        .update(noticiaData)
        .eq('id_noticia', id)
        .select();
  
      if (updateError) {
        console.error('Error al actualizar noticia:', updateError);
        throw new Error('Error al actualizar noticia');
      }
  
      return data;
    } catch (error) {
      console.error('Error en updateNoticia:', error);
      throw error;
    }
  };

  //traer datos FormMatricula
  static async getTipoMatricula() {
    const { data, error } = await supabase
      .from('TipoMatricula')
      .select('id_TipoMatricula, tipoMatricula');
    if (error) throw error;
    return data;
  }
  static async getPac() {
    const { data, error } = await supabase
      .from('Pac')
      .select('id_Pac, pac');
    if (error) throw error;
    return data;
  }
  

  static async getCentros() {
    const { data, error } = await supabase
      .from('Centros')
      .select('id_Centros, Nombre');
    if (error) throw error;
    return data;
  } 


  static async createCancelacion(data) {
    const { id_Pac, id_TipoMatricula, fecha_inicioCancel, fecha_finCancel, hora_inicioCancel, hora_finCancel } = data;
    
    const { data: newCancelacion, error } = await supabase
      .from('CancelacionExcepcional')
      .insert([{ id_Pac, id_TipoMatricula, fecha_inicioCancel, fecha_finCancel, hora_inicioCancel, hora_finCancel }]);

    if (error) {
      throw error;
    }
    return newCancelacion;
  }
///Modelo para crear una configuracion de matricula 
static async createConfiguracion(data) {
  const {
    id_TipoMatricula,
    fecha_inicioPAC,
    fecha_finPAC,
    fecha_inicioMatri,
    fecha_finMatri,
    hora_inicioMatri,
    hora_finMatri,
    fecha_matri1,
    indice_desdeMatri1,
    indice_hastaMatri1,
    pIngreso_desdeMatri1,
    pIngreso_hastaMatri1,
    fecha_matri2,
    indice_desdeMatri2,
    indice_hastaMatri2,
    pIngreso_desdeMatri2,
    pIngreso_hastaMatri2,
    fecha_matri3,
    indice_desdeMatri3,
    indice_hastaMatri3,
    fecha_matri4,
    indice_desdeMatri4,
    indice_hastaMatri4,
    fecha_matri5,
    indice_desdeMatri5,
    indice_hastaMatri5,
    id_Pac
  } = data;

  const { data: newConfiguracion, error } = await supabase
    .from('ConfiguracionMatricula')
    .insert([{
      id_TipoMatricula,
      fecha_inicioPAC,
      fecha_finPAC,
      fecha_inicioMatri,
      fecha_finMatri,
      hora_inicioMatri,
      hora_finMatri,
      fecha_matri1,
      indice_desdeMatri1,
      indice_hastaMatri1,
      pIngreso_desdeMatri1,
      pIngreso_hastaMatri1,
      fecha_matri2,
      indice_desdeMatri2,
      indice_hastaMatri2,
      pIngreso_desdeMatri2,
      pIngreso_hastaMatri2,
      fecha_matri3,
      indice_desdeMatri3,
      indice_hastaMatri3,
      fecha_matri4,
      indice_desdeMatri4,
      indice_hastaMatri4,
      fecha_matri5,
      indice_desdeMatri5,
      indice_hastaMatri5,
      id_Pac
    }]);

  if (error) {
    throw error;
  }
  return newConfiguracion;
}


static async getConfiguraciones() {
  const { data, error } = await supabase
    .from('ConfiguracionMatricula')
    .select(`
      *,
      Pac (id_Pac, pac),
      TipoMatricula (id_TipoMatricula, tipoMatricula)
    `);

  if (error) {
    throw error;
  }
  return data;
}

static async getConfiguracionById(id) {
  const { data, error } = await supabase
    .from('ConfiguracionMatricula')
    .select(`
      *,
      Pac (id_Pac, pac),
      TipoMatricula (id_TipoMatricula, tipoMatricula)
    `)
    .eq('id_ConfMatri', id)
    .single();

  if (error) {
    throw error;
  }
  return data;
}

static async updateConfiguracion(id, data) {
  console.log('Updating configuration with ID:', id);
  console.log('Data to update:', data);

  const { data: updatedConfiguracion, error } = await supabase
    .from('ConfiguracionMatricula')
    .update(data)
    .eq('id_ConfMatri', id)
    .select(`
      *,
      Pac (id_Pac, pac),
      TipoMatricula (id_TipoMatricula, tipoMatricula)
    `);

  if (error) {
    console.error('Error in updateConfiguracion:', error);
    throw error;
  }

  console.log('Updated configuration:', updatedConfiguracion);
  return updatedConfiguracion;
}

static async updateCancelacion(id, updateData) {
  const { data, error } = await supabase
    .from('CancelacionExcepcional')
    .update(updateData)
    .eq('id_canExcep', id)
    .select();

  if (error) {
    throw error;
  }
  return data;
}




static async deleteCancelacionExcep(id) {
  const { data, error } = await supabase
    .from('CancelacionExcepcional')
    .delete()
    .eq('id_canExcep', id);

  if (error) {
    throw error;
  }
  return data;
}

static async deleteConfiguracion(id) {
  const { data, error } = await supabase
    .from('ConfiguracionMatricula')
    .delete()
    .eq('id_ConfMatri', id);

  if (error) {
    throw error;
  }
  return data;
}

static async getCancelacionExcepcional() {
  // Consulta a la tabla CancelacionExcepcional
  let query = supabase
    .from('CancelacionExcepcional')
    .select(`
      id_canExcep,
      created_at,
      Pac (
        pac
      ),  
      TipoMatricula (
        tipoMatricula
      )
    `)
   

  // Ejecutar la consulta
  const { data: configuraciones, error } = await query;

  // Manejo de errores
  if (error) throw error;

  // Transformar los datos a la forma esperada
  return configuraciones.map(configuraciones => ({
    id_canExcep: configuraciones.id_canExcep,
    created_at: configuraciones.created_at,
    pac: configuraciones.Pac.pac,
    tipoMatricula: configuraciones.TipoMatricula.tipoMatricula
  }));
}

static async getCancelacionExcepcionalById(id) {
  const { data, error } = await supabase
    .from('CancelacionExcepcional')
    .select(`
      id_canExcep,
      created_at,
      Pac (
        id_Pac,
        pac
      ),  
      TipoMatricula (
        id_TipoMatricula,
        tipoMatricula
      ),
      fecha_inicioCancel,
      fecha_finCancel,
      hora_inicioCancel,
      hora_finCancel
    `)
    .eq('id_canExcep', id)
    .single();
  if (error) {
    throw error;
  }
  return data;
}







static async crearUsuarioParaCometChat(uid, name) {
  try {
    const response = await fetch(`${process.env.COMETCHAT_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'appId': process.env.COMETCHAT_APP_ID,
        'apiKey': process.env.COMETCHAT_API_KEY,
      },
      body: JSON.stringify({ uid, name }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error al crear un usuario para CometChat: ${errorData.message}`);
    }

    const data = await response.json();
    console.log('Usuario creado en COMETCHAT exitosamente:', data);
  } catch (error) {
    console.error('Error al crear un usuario para CometChat:', error.message);
  }
};

};  



module.exports = Admin;
