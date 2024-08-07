const supabase = require('../config/supabase');
const XLSX = require('xlsx');
const fs = require('fs');

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
          // Obtener la data de la seccion
          const { data: dataSeccion, error: errorSeccion } = await supabase
            .from('Secciones')
            .select('codigoAsignatura, Asignaturas(nombre)')
            .eq('id_Secciones', id_Secciones);
        
          if (errorSeccion) {
            throw errorSeccion;
          }
        
          // Obtener los estudiantes de la seccion
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
        
          // Aquí estaba el problema. Asegurémonos de que uniqueStudent sea un array de enteros.
          const uniqueStudent = [...new Set(students.map(id => parseInt(id, 10)))];
        
          let { data: dataStudents, error: errorStudents } = await supabase
            .from('Usuario')
            .select('Nombre, Apellido, estudiante(numeroCuenta)')
            .in('id', uniqueStudent);  // Usamos .in() con un array de enteros.
        
          if (errorStudents) {
            throw errorStudents;
          }
        
          return { seccion: id_Secciones, codigo: dataSeccion, estudiantes: dataStudents };
        }
        
   
      static async saveListStudents(data) {
        const {seccion, codigo, estudiantes} = data;

        const ws_data = [
          [`Asignatura: ${codigo[0].Asignaturas.nombre} - Seccion: ${seccion} - Codigo: ${codigo[0].codigoAsignatura}`],
          [],
          ['No.','Nombre', 'Apellido', 'Numero de Cuenta'],
        ];

        estudiantes.forEach((student, index) => {
          ws_data.push([
            index + 1,
             student.Nombre,
              student.Apellido, 
              student.estudiante[0].numeroCuenta.toString(10)
            ]);
        });

        const ws = XLSX.utils.aoa_to_sheet(ws_data);

        ws['!merges'] = [
          { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }];
        ws['A1'].s = { alignment: { horizontal: 'center' } }; 

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, `Seccion_${seccion}`);


        const fileName = `Seccion_${seccion}.xlsx`;
        XLSX.writeFile(wb, fileName);

      }
}

module.exports = Teacher;