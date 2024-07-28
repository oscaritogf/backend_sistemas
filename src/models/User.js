const supabase = require('../config/supabase');
const bcrypt = require('bcrypt');

class User {
  


    static async findByIdentifier(identifier, userType) {
      let data, error;
      if (userType === 'empleado') {
        ({ data, error } = await supabase
          .from('empleado')
          .select(`
            *,
            Usuario (*),
            estado,
            Departamentos (id_Departamento, Nombre),
            Centros (id_Centros, Nombre)
          `)
          .eq('numeroEmpleado', identifier)
          .single());
      } else {
        ({ data, error } = await supabase
          .from('estudiante')
          .select(`
            *,
            Usuario (*),
             Departamentos (id_Departamento, Nombre)
          `)
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
          departamento: data.Departamentos.Nombre,
          id_departamento: data.Departamentos.id_Departamento,

          id_centro: data.Centros.id_Centros,
          //id_Departamento: data.Departamentos.id,
          ...(userType === 'empleado' 
            ? { numeroEmpleado: data.numeroEmpleado, estado: data.estado } 
            : { numeroCuenta: data.numeroCuenta })
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
  static async getCentros(userId) {
    const { data, error } = await supabase
      .from('Centros')
      .select(`
        centros (id_centros, Nombre)
      `)
      .eq('id_centros', userId);

    if (error) throw error;
    return data.map(ur => ur.centros.Nombre);
  }


  static async create(userData) {
    const { Contrasena, ...otherData } = userData;
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(Contrasena, saltRounds);

    const { data, error } = await supabase
      .from('Usuario')
      .insert({ ...otherData, Contrasena: hashedPassword })
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
      .update({ Contrasena: hashedPassword })
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  }
}

module.exports = User;