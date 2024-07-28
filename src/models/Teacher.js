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
      
      static async getStudentsBySeccion(id_Secciones) {
          //Obtener los estudiantes de la seccion
        const { data, error } = await supabase
          .from('matricula')
          .select('id_estudiante, estudiante(usuario)')
          .eq('id_seccion', id_Secciones);
   
        if (error) {
          throw error;
        }

        if (data.length === 0) {
          return { seccion: id_Secciones, estudiantes: [] };
        }
        
        const students = data.map(record => record.estudiante.usuario);

        const uniqueStudent = [...new Set(students)];


        let { data: dataStudents, error: errorStudents } = await supabase
          .from('Usuario')
          .select('Nombre, Apellido, Correo')
          .eq('id', students);

        if (errorStudents) {
          throw errorStudents;
        }

        return { seccion: id_Secciones, estudiantes: dataStudents };
      } 
   
      

}

module.exports = Teacher;