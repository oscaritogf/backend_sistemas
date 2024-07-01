const User = require('../models/User');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  try {
    const { numeroEmpleado, numeroCuenta, contrasena } = req.body;
    console.log('Datos recibidos:', { numeroEmpleado, numeroCuenta, contrasena });

    let identifier;
    if (numeroEmpleado) {
      identifier = numeroEmpleado;
    } else if (numeroCuenta) {
      identifier = numeroCuenta;
    } else {
      return res.status(400).json({ message: 'Debe proporcionar un número de empleado o número de cuenta' });
    }

    console.log('Identificador a buscar:', identifier);

    const user = await User.findByIdentifier(identifier);

    if (!user) {
      console.log('Usuario no encontrado');
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    console.log('Usuario encontrado:', user);

    const isPasswordValid = await User.verifyPassword(contrasena, user.contrasena);
    console.log('Contraseña válida:', isPasswordValid);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    const roles = await User.getRoles(user.id);

    const token = jwt.sign(
      { 
        userId: user.id, 
        tipo: user.tipo,
        roles: roles.map(r => r.nombre)
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ 
      message: 'Login exitoso', 
      user: { 
        id: user.id, 
        nombre: user.nombre, 
        apellido: user.apellido,
        tipo: user.tipo,
        roles: roles.map(r => r.nombre)
      },
      token 
    });

  } catch (error) {
    console.error('Error detallado:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

exports.register = async (req, res) => {
  try {
    const userData = req.body;
    const newUser = await User.create(userData);
    res.status(201).json({ message: 'Usuario registrado exitosamente', user: newUser });
  } catch (error) {
    res.status(500).json({ message: 'Error al registrar usuario', error: error.message });
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const { userId } = req.user;
    const { currentPassword, newPassword } = req.body;

    const user = await User.findByIdentifier(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const isPasswordValid = await User.verifyPassword(currentPassword, user.contrasena);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Contraseña actual incorrecta' });
    }

    const updatedUser = await User.updatePassword(userId, newPassword);
    res.json({ message: 'Contraseña actualizada exitosamente', user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar contraseña', error: error.message });
  }
};