const nodemailer = require('nodemailer');
require('dotenv').config();
const Admin = require ('../models/Admin');
const supabase = require('../config/supabase');


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

const sendConfirmationEmail = async (to, nombre) => {
  try {
    await transporter.sendMail({
      from: '"Admisiones Universidad" <garcia152511@gmail.com>',
      to: to,
      subject: "Confirmación de registro en el proceso de admisiones",
      html: `
        <h1>¡Felicidades ${nombre}!</h1>
        <p>Has sido registrado exitosamente en el proceso de admisiones.</p>
        <p>Pronto recibirás más información sobre los siguientes pasos.</p>
        <p>Gracias por elegir nuestra institución.</p>
      `
    });
    console.log('Correo de confirmación enviado');
  } catch (error) {
    console.error('Error al enviar correo de confirmación:', error);
  }
};

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

const sendStudentWelcomeEmail = async (to, nombre, numeroCuenta, correoInstitucional, contrasena) => {
  try {
    await transporter.sendMail({
      from: '"Departamento de  Admisiones UANH" <garcia152511@gmail.com>',
      to: to,
      subject: "Bienvenido - Credenciales de acceso",
      html: `
        <h1>¡Bienvenido ${nombre}!</h1>
        <p>Has sido registrado exitosamente como estudiante en nuestro sistema.</p>
        <p>Tus credenciales de acceso son:</p>
        <ul>
          <li>Número de cuenta: ${numeroCuenta}</li>
          <li>Contraseña: ${contrasena}</li>
          <li>Correo Institucional: ${correoInstitucional}</li>
        </ul>
        <p>Por favor, cambia tu contraseña después del primer inicio de sesión.</p>
        <p>Si tienes alguna pregunta, no dudes en contactar al departamento de Admisiones.</p>
      `
    });
    console.log('Correo de bienvenida enviado al nuevo estudiante');
  } catch (error) {
    console.error('Error al enviar correo de bienvenida al estudiante:', error);
    throw error;
  }
};


const sendRejectionEmail = async (to, nombre) => {
  try {
    await transporter.sendMail({
      from: '"Admisiones Universidad" <garcia152511@gmail.com>',
      to: to,
      subject: "Confirmación de registro en el proceso de admisiones",
      html: `
        <h1>Hola ${nombre}!</h1>
        <p>Lamentamos informarte que no has aprovado el proceso de admisión.</p>
        <p>Estate pendiendte de los próximos procesos de admisión.</p>
        <p>Gracias por elegir nuestra institución.</p>
      `
    });
    console.log('Correo de rechazo enviado');
  } catch (error) {
    console.error('Error al enviar correo de rechazo:', error);
  }
};

const sendFriendRequestEmail = async (userName, userId, friendEmail, friendId) => {
  try {
    const acceptUrl = `http://localhost:3000/api/student/aceptarSolicitud?userId=${userId}&friendId=${friendId}`;
    
    await transporter.sendMail({
      from: '"Solicitud Amistad Universidad" <garcia152511@gmail.com>',
      to: friendEmail,
      subject: "Tienes una nueva solicitud de amistad",
      html: `
        <h1>Nueva solicitud de amistad!</h1>
        <p>${userName} te ha enviado una solicitud de amistad.</p>
        <a href="${acceptUrl}" style="display: inline-block; padding: 10px 20px; font-size: 16px; color: white; background-color: #007bff; text-decoration: none; border-radius: 5px;">Aceptar</a>
      `
    });
    console.log('Correo de solicitud de amistad enviado');
  } catch (error) {
    console.error('Error al enviar correo de solicitud de amistad:', error);
  }
};

const sendResetMail = async (to, token) => {
  try {
   await transporter.sendMail({
    from: '"UNAH" <admisiones71@gmail.com>',
    to: to,
    subject: "Recuperación de contraseña",
    html: `
      <h1>Recuperación de contraseña</h1>
      <p>Para recuperar tu contraseña, haz click en el siguiente enlace:</p>
      <a href="http://localhost:3000/reset/${token}">Recuperar contraseña</a>
    `
    });
    console.log('Correo de recuperación de contraseña enviado');
  } catch (error) {
    console.error('Error al enviar correo de recuperación de contraseña:', error);
  }
};

const sendEmailtoEmployee = async (to, nombre, numeroEmpleado, contrasena) => {
  try {
    await transporter.sendMail({
      from: '"Departamento de  Admisiones UANH" <garcia152511@gmail.com>',
      to: to,
      subject: "Bienvenido - Credenciales de acceso",
      html: `
        <h1>¡Bienvenido ${nombre}!</h1>
        <p>Has sido registrado exitosamente como estudiante en nuestro sistema.</p>
        <p>Tus credenciales de acceso son:</p>
        <ul>
          <li>Número de cuenta: ${numeroCuenta}</li>
          <li>Contraseña: ${contrasena}</li>
          <li>Correo Institucional: ${correoInstitucional}</li>
        </ul>
        <p>Por favor, cambia tu contraseña después del primer inicio de sesión.</p>
        <p>Si tienes alguna pregunta, no dudes en contactar al departamento de Admisiones.</p>
      `
    });
    console.log('Correo de bienvenida enviado al nuevo estudiante');
  } catch (error) {
    console.error('Error al enviar correo de bienvenida al estudiante:', error);
    throw error;
  }
};

const sendNotesNtfy = async (id_Secciones, numeroCuenta, id_Asignaturas) => {
  try {
    // Obtener datos de la asignatura
    const { data: dataAsignatura, error: errorAsignatura } = await supabase
      .from('Asignaturas')
      .select('nombre')
      .eq('codigo', id_Asignaturas)
      .single();

    if (errorAsignatura) {
      throw errorAsignatura;
    }

    const nombreAsignatura = dataAsignatura ? dataAsignatura.nombre : 'Asignatura desconocida';

    // Obtener datos del estudiante
    const { data: dataEstudiante, error: errorEstudiante } = await supabase
      .from('estudiante')
      .select('usuario')
      .eq('numeroCuenta', numeroCuenta)
      .single();

    if (errorEstudiante) {
      throw errorEstudiante;
    }

    if (!dataEstudiante) {
      throw new Error(`No se encontró estudiante con número de cuenta ${numeroCuenta}`);
    }

    // Obtener datos del usuario
    const { data: dataUsuario, error: errorUsuario } = await supabase
      .from('Usuario')
      .select('Nombre, Correo')
      .eq('id', dataEstudiante.usuario)
      .single();

    if (errorUsuario) {
      throw errorUsuario;
    }

    if (!dataUsuario) {
      throw new Error(`No se encontró usuario para el estudiante con número de cuenta ${numeroCuenta}`);
    }

    const { data:dataS, error:errorS } = await supabase
    .from('Secciones')
    .select('Hora_inicio')
    .eq('id_Secciones', id_Secciones)
    .single();

    if (errorS) {
      throw errorS;
    }
    
    const horaInicio = dataS.Hora_inicio;
    const nombre = dataUsuario.Nombre;
    const correo = dataUsuario.Correo;

    // Enviar el correo
    await transporter.sendMail({
      from: '"UANH" <garcia152511@gmail.com>',
      to: correo,
      subject: "Notas de la sección",
      html: `
        <h1>¡Hola ${nombre}!</h1>
        <p>Ya se han ingresado las calificaciones de la asignatura ${nombreAsignatura}, sección: ${horaInicio}.</p>
        <p>Por favor, revisa tu historial académico para ver tus calificaciones.</p>
        <p>Si tienes alguna pregunta, no dudes en contactar al departamento de soporte.</p>
      `
    });

    console.log('Correo de notificación de calificaciones enviado al estudiante');
  } catch (error) {
    console.error('Error al enviar correo de notificación de calificaciones:', error);
    console.error('Detalles:', { numeroCuenta, id_Secciones, id_Asignaturas });
    throw error;
  }
};


module.exports = { sendConfirmationEmail, sendEmployeeWelcomeEmail, sendStudentWelcomeEmail, sendRejectionEmail, sendResetMail, sendFriendRequestEmail, sendEmailtoEmployee, sendNotesNtfy };

