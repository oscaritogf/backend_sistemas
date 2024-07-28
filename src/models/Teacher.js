const supabase = require('../config/supabase');

class Teacher {

        static async getSeccionesByDocente(id_Docentes) {
       
            const { data, error } = await supabase
              .from('Secciones')
              .select('*')
              .eq('id_Docentes', id_Docentes);
      
            if (error) {
              throw error;
            }
      
            return data;
        
        }
      
      
   
      

}

module.exports = Teacher;