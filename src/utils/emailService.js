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
          li>Correo Institucional: ${correoInstitucional}</li>
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

module.exports = { sendConfirmationEmail, sendEmployeeWelcomeEmail, sendStudentWelcomeEmail };

