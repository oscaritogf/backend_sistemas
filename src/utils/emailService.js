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

module.exports = { sendConfirmationEmail };