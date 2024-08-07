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

      static async uploadNotes(id_Secciones, id_Docentes, id_Estudiante, nota, proceso) {
        try {
          // Obtener el estado del proceso
          const { data: dataNota, error: errorNota } = await supabase
            .from('ProcesoNotas')
            .select('estado')
            .eq('id', proceso)
            .single(); // Asegúrate de obtener un solo registro
          
          if (errorNota) {
            throw errorNota;
          }
      
          // Verificar que el estado del proceso es un booleano
          if (typeof dataNota.estado !== 'boolean') {
            throw new Error('El estado del proceso no es un valor booleano');
          }
      
          // Verificar si el proceso está cerrado
          if (!dataNota.estado) {
            return { message: 'El proceso de notas está cerrado' };
          }
      
          // Obtener el código de asignatura
          const { data: dS, error: eS } = await supabase
            .from('Secciones')
            .select('codigoAsignatura')
            .eq('id_Secciones', id_Secciones) // Cambia 'id' por el nombre correcto de la columna
            .single(); // Asegúrate de obtener un solo registro
      
          if (eS) {
            throw eS;
          }
      
          // Validar nota
          if (nota === '' || nota < 0 || nota > 100) {
            return { message: 'La nota debe estar entre 0 y 100 y no puede estar vacía' };
          }
      
          // Determinar observación
          let obs = 'NSP';
          if (nota >= 65) {
            obs = 'APB';
          } else if (nota < 65 && nota !== 0) {
            obs = 'RPB';
          }
      
          // Verificar si ya existe una nota para el estudiante en la sección
          const { data: existingNote, error: errorExistingNote } = await supabase
            .from('Calificaciones_Registro')
            .select('id_CR') // Selecciona un campo que siempre existe, por ejemplo, 'id'
            .eq('id_Seccion', id_Secciones)
            .eq('id_Estudiante', id_Estudiante)
            .single(); // Obtener un solo registro
      
          if (errorExistingNote) {
            throw errorExistingNote;
          }
      
          // Si ya existe una nota, evita la inserción
          if (existingNote) {
            return { message: 'Ya existe una nota para este estudiante en esta sección' };
          }
      
          // Insertar la nota
          const { data: dataNotaEstudiante, error: errorNotaEstudiante } = await supabase
            .from('Calificaciones_Registro')
            .insert([{
              id_Seccion: id_Secciones,
              id_Docente: id_Docentes,
              id_Estudiante: id_Estudiante,
              codigo_Asignatura: dS.codigoAsignatura,
              nota: nota,
              obs: obs
            }]);
      
          if (errorNotaEstudiante) {
            throw errorNotaEstudiante;
          }
      
          return { message: 'Nota actualizada' };
        } catch (error) {
          console.error('Error en uploadNotes:', error.message);
          return { message: 'Error al subir notas', error: error.message };
        }
      }
      
      
  static async getNotesByDocent(id_Secciones, id_Docentes) {
    const { data, error } = await supabase
      .from('Calificaciones_Registro')
      .select('id_Estudiante, nota, obs')
      .eq('id_Seccion', id_Secciones)
      .eq('id_Docente', id_Docentes);

    if (error) {
      throw error;
    }

    return data;
  }

  static async updateNotes(id_Secciones, id_Docentes, id_Estudiante, nota, proceso) {
    const { data: dataNota, error: errorNota } = await supabase
      .from('ProcesoNotas')
      .select('estado')
      .eq('id', proceso);

    if (errorNota) {
      throw errorNota;
    }

    if (dataNota.estado === false) {
      return { message: 'El proceso de notas esta cerrado' };
    }

    if (nota < 0 || nota > 100) {
      return { message: 'La nota debe estar entre 0 y 100' };
    }

    if (nota === '') {
      return { message: 'La nota no puede estar vacia' };
    }

    let obs = 'NSP';

    if (nota >= 65) {
      obs = 'APB';
    } else {
      obs = 'RPB';
    } 

    if (nota === 0) {
      obs = 'NSP';
    }

    const { data: dataNotaEstudiante, error: errorNotaEstudiante } = await supabase
      .from('Calificaciones_Registro')
      .update([{ nota: nota, obs: obs }])
      .eq('id_Seccion', id_Secciones)
      .eq('id_Docente', id_Docentes)
      .eq('id_Estudiante', id_Estudiante);

    if (errorNotaEstudiante) {
      throw errorNotaEstudiante;
    }

    return { message: 'Nota actualizada' };
  }


}
module.exports = Teacher;