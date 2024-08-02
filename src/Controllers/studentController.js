const Student = require('../models/Student');
const supabase = require('../config/supabase');
const { sendFriendRequestEmail } = require('../utils/emailService');

exports.getData = async (req, res) => {
    try {
      // Aquí iría la lógica para obtener datos del estudiante
      res.json({ message: 'Datos del estudiante', data: { id: req.user.userId, tipo: 'estudiante' } });
    } catch (error) {
      res.status(500).json({ message: 'Error al obtener datos del estudiante', error: error.message });
    };
  };


exports.updateProfile = async (req, res) => {
    try {
        const { id_Usuario } = req.params;
        const { Fotografia1, Fotografia2, Fotografia3 } = req.files;

        const usuarioData = {...req.body, Fotografia1, Fotografia2, Fotografia3, id_Usuario};

        console.log('Datos de usuario:', usuarioData);

        const data = await Student.updateProfile(id_Usuario, usuarioData);
        res.json({ message: 'Perfil actualizado', data });
        // res.json({ message: 'Perfil actualizado', usuarioData });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar perfil', error: error.message });
    };
};

exports.getProfile = async (req, res) => {
    try {
        const { id_Usuario } = req.params;
        const data = await Student.getProfile(id_Usuario);
        res.json({ message: 'Perfil obtenido', data });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener perfil', error: error.message });
    };
};

exports.updateEstudiante = async (req, res) => {
    try {
        const numeroCuenta = parseInt( req.params.numeroCuenta, 10 );
        console.log('el numero de cuenta del estudiante que quieres editar es: ',numeroCuenta);

        if(isNaN(numeroCuenta)){
            return res.status(404).json({ message:'numero de cuenta invalido'});
        }

         const estudianteData = {
            ...req.body,
            Imagen: req.file ? req.file : null 
        };
      
          
        const updatedEstudiante = await Student.updateEstudiante(numeroCuenta, estudianteData);
        res.json({ message: 'Estudiante actualizado', updatedEstudiante });
    } catch (error) {
        console.error('Error al actualizar el estudiante en studentController:', error);
        res.status(500).json({ message: 'Error al actualizar estudiante', error: error.message });
    };
};

exports.enviarSolicitud = async (req, res) => {
    const { friendEmail, friendId, userName, userId } = req.body;

    try {
        await sendFriendRequestEmail(userName, userId, friendEmail, friendId);
        res.json({ message: 'Solicitud de amistad enviada', data: { friendEmail, friendId, userName, userId } });
    } catch (error) {
        res.status(500).json({ message: 'Error al enviar solicitud de amistad', error: error.message });
    };
}

exports.aceptarSolicitud = async (req, res) => {
    const { userId, friendId } = req.query;
  
    if (!userId || !friendId) {
      return res.status(400).json({ message: 'Faltan parámetros' });
    }
  
    try {
      // Llamar a la función para agregar el amigo en CometChat
      await newFriendCometChat(userId, friendId);
  
      // Enviar una respuesta de éxito
      res.redirect('http://localhost:5173/solicitudAceptada');
    //   res.json({ message: 'Solicitud de amistad aceptada' });
    } catch (error) {
      res.status(500).json({ message: 'Error al aceptar solicitud de amistad', error: error.message });
    }
  };
  
  const newFriendCometChat = async(userId, friendId) => {
    try {
      const response = await fetch(`${process.env.COMETCHAT_BASE_URL}/users/${userId}/friends`, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          apiKey: process.env.COMETCHAT_API_KEY,
        },
        body: JSON.stringify({ accepted: [ friendId ] }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error al agregar amigo en CometChat: ${errorData.message}`);
      }
  
      const data = await response.json();
      console.log('Amigo agregado en COMETCHAT exitosamente:', data);
    } catch (error) {
      console.error('Error al agregar amigo en CometChat:', error.message);
    }
  }; 

exports.getAllUsers = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('Usuario')
            .select('id, Nombre, Apellido, Imagen')

        if (error) {
            throw new Error(error.message);
        }

        res.json({ message: 'Usuarios obtenidos', data });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener todos los usuarios', error: error.message });
    }
}