const supabase = require('../config/supabase');
const bcrypt = require('bcrypt');

class User {
  static async findByIdentifier(identifier) {
    console.log('Buscando usuario con identificador:', identifier);

    // Primero, buscar en la tabla Empleado
    const { data: employeeData, error: employeeError } = await supabase
      .from('empleado')
      .select('*, Usuario (*)')
      .eq('numeroEmpleado', identifier)
      .single();

    if (employeeError && employeeError.code !== 'PGRST116') {
      console.error('Error al buscar empleado:', employeeError);
      throw employeeError;
    }

    if (employeeData) {
      console.log('Empleado encontrado:', employeeData);
      return { ...employeeData.Usuario, tipo: 'empleado', numeroEmpleado: employeeData.numeroEmpleado };
    }

    // Si no se encuentra como empleado, buscar en la tabla Estudiante
    const { data: studentData, error: studentError } = await supabase
      .from('estudiante')
      .select('*, Usuario (*)')
      .eq('numeroCuenta', identifier)
      .single();

    if (studentError && studentError.code !== 'PGRST116') {
      console.error('Error al buscar estudiante:', studentError);
      throw studentError;
    }

    if (studentData) {
      console.log('Estudiante encontrado:', studentData);
      return { ...studentData.Usuario, tipo: 'estudiante', numeroCuenta: studentData.numeroCuenta };
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
    return data.map(ur => ur.rol);
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