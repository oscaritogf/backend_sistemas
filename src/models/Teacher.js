const supabase = require('../config/supabase');
const XLSX = require('xlsx');
const fs = require('fs');
const { error } = require('console');

class Teacher {

    static async getIdUser(numeroEmpleado) {
        const { data, error } = await supabase
            .from('empleado')
            .select('usuario')
            .eq('numeroEmpleado', numeroEmpleado)
            .single();

        if (error) {
            throw error;
        }

        return data;
    }

    static async updateVideo(id_Secciones, urlVideo) {
        const { data, error } = await supabase
            .from('Secciones')
            .update({ urlVideo: urlVideo })
            .eq('id_Secciones', id_Secciones);
        if (error) {
            throw error;
        }
    }

        static async getSeccionesByDocente(id_Docentes) {
            const { data, error } = await supabase
            .from('Secciones')
            .select(`
                id_Secciones,
                Hora_inicio,
                Hora_Final,
                id_Docentes,
                Cupos,
                Asignaturas (
                  nombre,
                  codigo,
                  uv
                ), 
                Edificios(
                  Nombre
                ),
                Aula(
                  Nombre
                ),
                Dias:seccion_dias!inner(
                  Dia:Dias (
                    Nombre
                  )
                )
            `)
            .eq('id_Docentes', id_Docentes)
            .eq('estado', true);       
            if (error) {
              throw error;
            }
      
            return data;
        
        }
        static async getNotasBySeccion(id_Seccion) {
          const { data: notasSeccion, error: notasError } = await supabase
            .from('Calificaciones_Registro')
            .select(`
              id_Estudiante,
              nota,
              obs,
              estudiante(
                usuario(
                  Nombre,
                  Apellido
                )
              )
            `)
            .eq('id_Seccion', id_Seccion);
        
          if (notasError) {
            throw new Error(notasError.message);
          }
        
          return notasSeccion.map(nota => ({
            id_Estudiante: nota.id_Estudiante,
            nombreEstudiante: `${nota.estudiante.usuario.Nombre} ${nota.estudiante.usuario.Apellido}`,
            nota: nota.nota,  // Asegúrate de que este campo contiene el valor correcto
            obs: nota.obs
          }));
        }

        static async getProcesoNota() {
          const { data: procesoNotas, error:errorProcesoNotas } = await supabase
              .from('ProcesoNotas')
              .select(`
                  *
                `)
                .eq('estado', true);
                
                if (errorProcesoNotas) {
                  throw new Error(errorProcesoNotas.message);
                }
            
                return procesoNotas.map(proceso => ({
                  id_ProcesoNotas: proceso.id,
                  estado:proceso.estado ,
                  fecha_inicio:proceso.fecha_inicio,
                  fecha_final:proceso.fecha_final,
                  id_ConfMatri:proceso.id_ConfMatri,
                }));
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
        
   // Método para generar el archivo Excel
static async saveListStudents(data, res) {
  const { seccion, codigo, estudiantes } = data;

  const ws_data = [
      [`Asignatura: ${codigo[0].Asignaturas.nombre} - Sección: ${seccion} - Código: ${codigo[0].codigoAsignatura}`],
      [],
      ['No.', 'Nombre', 'Apellido', 'Número de Cuenta'],
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

  // Centrar el título de la sección
  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }];
  ws['A1'].s = { alignment: { horizontal: 'center' } };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `Seccion_${seccion}`);

  // Escribe el archivo en un buffer
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

  // Establecer encabezados y enviar el archivo como respuesta
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=Seccion_${seccion}.xlsx`);
  res.send(excelBuffer);
}
     
static async uploadNotes(id_Secciones, id_Docentes, id_Estudiante, nota, proceso, detail) {
  try {
      const { data: dataNota, error: errorNota } = await supabase
          .from('ProcesoNotas')
          .select('estado , id_ConfMatri')
          .eq('id', proceso)
          .single();

      if (errorNota) {
          return { message: 'Error al obtener datos del proceso de notas', error: errorNota.message };
      }

      if (typeof dataNota.estado !== 'boolean') {
          return { message: 'El estado del proceso no es un valor booleano' };
      }

      if (!dataNota.estado) {
          return { message: 'El proceso de notas está cerrado' };
      }

      const { data: dS, error: eS } = await supabase
          .from('Secciones')
          .select('codigoAsignatura')
          .eq('id_Secciones', id_Secciones)
          .maybeSingle();

      if (eS) {
          return { message: 'Error al obtener datos de la sección', error: eS.message };
      }

      if (!dS) {
          return { message: 'No se encontró la sección o se encontraron múltiples secciones' };
      }

      if (nota === '' || nota < 0 || nota > 100) {
          return { message: 'La nota debe estar entre 0 y 100 y no puede estar vacía' };
      }

      let obs = 'NSP';
      if (nota >= 65) {
          obs = 'APB';
      } else if (nota < 65 && nota !== 0) {
          obs = 'RPB';
      }

      if (detail === 1){
          obs = 'ABD';
      }

      const { data: dataEstudiante, error: errorEstudiante } = await supabase
          .from('estudiante')
          .select('id_Departamento')
          .eq('numeroCuenta', id_Estudiante)
          .maybeSingle();

      if (errorEstudiante) {
          return { message: 'Error al obtener datos del estudiante', error: errorEstudiante.message };
      }

      const { data: existingNote, error: errorExistingNote } = await supabase
          .from('Calificaciones_Registro')
          .select('id_CR')
          .eq('id_Seccion', id_Secciones)
          .eq('id_Estudiante', id_Estudiante)
          .maybeSingle();

      if (errorExistingNote) {
          return { message: 'Error al verificar notas existentes', error: errorExistingNote.message };
      }

      if (existingNote) {
         return { message: 'Ya existe una nota para este estudiante en esta sección' };
      }

      const { data: dataNotaEstudiante, error: errorNotaEstudiante } = await supabase
          .from('Calificaciones_Registro')
          .insert([{
              id_Seccion: id_Secciones,
              id_Docente: id_Docentes,
              id_Estudiante: id_Estudiante,
              codigo_Asignatura: dS.codigoAsignatura,
              nota: nota,
              obs: obs,
              id_CunfigMatricula: dataNota.id_ConfMatri,
              id_Departamento: dataEstudiante.id_Departamento
          }]);

      if (errorNotaEstudiante) {
          return { message: 'Error al registrar la nota', error: errorNotaEstudiante.message };
      }

      return { message: 'Nota registrada' };
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
    try {
      // Obtener el estado del proceso de notas
      const { data: dataNota, error: errorNota } = await supabase
        .from('ProcesoNotas')
        .select('estado')
        .eq('id', proceso)
        .single(); // Asegúrate de usar .single() para obtener un único registro
  
      if (errorNota) {
        throw errorNota;
      }
  
      if (dataNota.estado === false) {
        return { error: 'El proceso de notas está cerrado' };
      }
  
      if (nota < 0 || nota > 100) {
        return { error: 'La nota debe estar entre 0 y 100' };
      }
  
      if (nota === '') {
        return { error: 'La nota no puede estar vacía' };
      }
  
      // Determinar la observación
      let obs = 'NSP';
      if (nota >= 65) {
        obs = 'APB';
      } else if (nota !== 0) {
        obs = 'RPB';
      }
  
      // Actualizar la nota
      const { data: dataNotaEstudiante, error: errorNotaEstudiante } = await supabase
        .from('Calificaciones_Registro')
        .update({ nota, obs })
        .eq('id_Seccion', id_Secciones)
        .eq('id_Docente', id_Docentes)
        .eq('id_Estudiante', id_Estudiante);
  
      if (errorNotaEstudiante) {
        throw errorNotaEstudiante;
      }
  
      return { message: 'Nota actualizada' };
    } catch (error) {
      console.error('Error en updateNotes:', error.message);
      return { error: 'Error al actualizar la nota', details: error.message };
    }
  }
  

}
module.exports = Teacher;