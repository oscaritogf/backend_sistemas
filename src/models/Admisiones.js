const supabase = require('../config/supabase');

class Admision {
  static async create(admisionData) {
    const { data, error } = await supabase
      .from('Admisiones')
      .insert([admisionData]);
    if (error) throw error;
    return data;
  }

  static async getCentros() {
    const { data, error } = await supabase
      .from('Centro')
      .select('id_Centro, nombre');
    if (error) throw error;
    return data;
  }

  static async getCarreras() {
    const { data, error } = await supabase
      .from('Carrera')
      .select('id_Carrera, nombre');
    if (error) throw error;
    return data;
  }
}

module.exports = Admision;