const supabase = require('../config/supabase');
const bcrypt = require('bcrypt');

class User {
  
    static async findByIdentifier(identifier, userType) {
  
    
      let data, error;
    
      if (userType === 'empleado') {
        ({ data, error } = await supabase
          .from('empleado')
          .select('*, Usuario (*)')
          .eq('numeroEmpleado', identifier)
          .single());
      } else {
        ({ data, error } = await supabase
          .from('estudiante')
          .select('*, Usuario (*)')
          .eq('numeroCuenta', identifier)
          .single());
      }
    
      if (error && error.code !== 'PGRST116') {
        console.error('Error al buscar usuario:', error);
        throw error;
      }
    
      if (data) {
        console.log('Usuario encontrado:', data);
        return { 
          ...data.Usuario, 
          tipo: userType, 
          ...(userType === 'empleado' ? { numeroEmpleado: data.numeroEmpleado } : { numeroCuenta: data.numeroCuenta })
        };
      }
    
      console.log('Usuario no encontrado');
      return null;
    }
  static async getRoles(userId) {
    const { data, error } = await supabase
      .from('UsuarioRol')
      .select(`
        rol (id, nombre)
      `)
      .eq('id_Usuario', userId);

    if (error) throw error;
    return data.map(ur => ur.rol.nombre);
  }

  static async create(userData) {
    const { contrasena, ...otherData } = userData;
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(contrasena, saltRounds);

    const { data, error } = await supabase
      .from('Usuario')
      .insert({ ...otherData, contrasena: hashedPassword })
      .single();

    if (error) throw error;
    return data;
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  // Añadir este método
  static async updatePassword(userId, newPassword) {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    const { data, error } = await supabase
      .from('Usuario')
      .update({ contrasena: hashedPassword })
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  }
}

module.exports = User;