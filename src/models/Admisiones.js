const supabase = require('../config/supabase');

class Admision {
  
  static async getIntentosByDNI(dni) {
    const { data, error } = await supabase
      .from('Admisiones')
      .select('intentos')
      .eq('dni', dni)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;

    return data.length > 0 ? data[0].intentos : 0;
  }
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
    .select(`
      id_Carrera,
      nombre,
      id_Facultad,
      Facultades:id_Facultad (
        id_Facultad,
        nombre
      )
    `);
  if (error) {
    console.error('error al obtener carreras', error);
    throw error;
  }
  return data;
}

  static async getExamenes(carreraId) {
    const { data, error } = await supabase
      .from('carreraExamenes')
      .select('id_Examen, Examenes(id_Examenes, nombre)')
      .eq('id_Carrera', carreraId);
    if (error) throw error;
    return data.map(item => item.Examenes);
  }
}



module.exports = Admision;