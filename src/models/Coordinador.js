const supabase = require('../config/supabase');
const XLSX = require('xlsx');
const fs = require('fs');


class Coordinador {

   
      static async getSeccionesByDepartamento(id_Departamento) {
        const { data: secciones, error } = await supabase
          .from('Secciones')
          .select('id_Secciones, Asignaturas(codigo, nombre), id_Docentes, empleado(usuario(Nombre, Apellido)), id_Edificios, id_Aula, Cupos')
          .eq('id_Departamento', id_Departamento)
    
        if (error) {
          console.error('Error fetching secciones:', error)
          return []
        }
    
        // Crear un array para almacenar los resultados con los conteos de matriculados
        const seccionesConConteo = []
    
        // Iterar sobre cada sección y obtener el conteo de matriculados
        for (const seccion of secciones) {
          const { count: matriculados, error: errorCupos } = await supabase
            .from('matricula')
            .select('id_seccion', { count: 'exact' })
            .eq('id_seccion', seccion.id_Secciones)
    
          if (errorCupos) {
            console.error(`Error fetching matricula count for seccion ${seccion.id_Secciones}:`, errorCupos)
            seccion.matriculados = 0
          } else {
            seccion.matriculados = matriculados
          }
    
          seccionesConConteo.push(seccion)
        }
    
        return seccionesConConteo
      }
    
    
  

}

module.exports = Coordinador;

