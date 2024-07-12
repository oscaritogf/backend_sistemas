const supabase = require('../config/supabase');
const fs = require('fs').promises; // Importar el módulo fs para trabajar con el sistema de archivos

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

  static async getCSV() {
    const { data, error } = await supabase
      .from('Admisiones')
      .select('*');

        // Obtener datos de la tabla Centros
    const { data: centrosData, error: centrosError } = await supabase
    .from('Centro')
    .select('id_Centro,nombre');

  if (centrosError) {
    console.error('Error al obtener datos de Centros', centrosError);
    throw new Error('Error al obtener datos de Centros');
  }

          // Crear un mapa de id_Centro a codigo
    const centrosMap = new Map();
    centrosData.forEach(centro => {
      centrosMap.set(centro.id_Centro, centro.nombre);
    });

         // Obtener datos de la tabla Centros
         const { data: carreraData, error: carreraError } = await supabase
         .from('Carrera')
         .select('id_Carrera,nombre');
     
       if (centrosError) {
         console.error('Error al obtener datos de Centros', centrosError);
         throw new Error('Error al obtener datos de Centros');
       }

               // Obtener datos de la tabla Carreras
                const { data: carrerasData, error: carrerasError } = await supabase
                .from('Carrera')
                .select('id_Carrera,nombre');

                if (carrerasError) {
                  console.error('Error al obtener datos de Carreras', carrerasError);
                  throw new Error('Error al obtener datos de Carreras');
                }

               // Crear un mapa de id_Carrera a nombre
               const carrerasMap = new Map();
               carrerasData.forEach(carrera => {
                 carrerasMap.set(carrera.id_Carrera, carrera.nombre);
               });
           

    if (error) {
      console.error('Error al obtener datos de Admisiones', error);
      throw error;
    }

    if (!data || data.length === 0) {
      throw new Error('No hay datos de Admisiones');
    }

    // Convertir los datos a formato CSV
    let csv = 'id_Admision,dni,primer_Nombre,segundo_Nombre,primer_Apellido,segundo_Apellido,Centro,Carrera,Sd_Carrera,email,intentos,nota1,nota2,aprobacionPAA,aprobacionPAM_PCCNS\n';
    data.forEach(admision => {
      const codigoCentro = centrosMap.get(admision.id_Centro) || '';
      const nombreCarrera = carrerasMap.get(admision.id_Carrera) || '';
      const nombreSdCarrera = carrerasMap.get(admision.id_Sd_Carrera) || '';
      csv += `${admision.id_Admision},${admision.dni},${admision.primer_Nombre},${admision.segundo_Nombre},${admision.primer_Apellido},${admision.segundo_Apellido},${codigoCentro},${nombreCarrera},${nombreSdCarrera},${admision.email},${admision.intentos},${admision.nota1},${admision.nota2},${admision.aprobacionPAA},${admision.aprobacionPAM_PCCNS}\n`;
    });

    // Guardar el CSV en un archivo

    try {
      const filePath = 'Admisiones.csv';
      await fs.writeFile('Admisiones.csv', csv);
      console.log('Archivo CSV de Admisiones creado con éxito.');
    } catch (error) {
      console.error('Error al escribir el archivo CSV', error);
    }

   
  }

  // static async getCSV() {
  //   const { data, error } = await supabase
  //     .from('Admisiones')
  //     .select('*');

  //   if (error) {
  //     console.error('Error al obtener datos de Admisiones', error);
  //     throw error;
  //   }

  //   if (!data || data.length === 0) {
  //     throw new Error('No hay datos de Admisiones');
  //   }

  //   // Convertir los datos a formato CSV
  //   let csv = 'id_Admision,dni,primer_Nombre,segundo_Nombre,primer_Apellido,segundo_Apellido,id_Centro,id_Carrera,id_Sd_Carrera,email,intentos,nota1,nota2,aprobacionPAA,aprobacionPAM_PCCNS\n';
  //   data.forEach(admision => {
  //     csv += `${admision.id_Admision},${admision.dni},${admision.primer_Nombre},${admision.segundo_Nombre},${admision.primer_Apellido},${admision.segundo_Apellido},${admision.id_Centro},${admision.id_Carrera},${admision.id_Sd_Carrera},${admision.email},${admision.intentos},${admision.nota1},${admision.nota2},${admision.aprobacionPAA},${admision.aprobacionPAM_PCCNS}\n`;
  //   });

  //   // Guardar el CSV en un archivo

  //   try {
  //     const filePath = 'Admisiones.csv';
  //     await fs.writeFile('Admisiones.csv', csv);
  //     console.log('Archivo CSV de Admisiones creado con éxito.');
  //   } catch (error) {
  //     console.error('Error al escribir el archivo CSV', error);
  //   }

   
  // }
  
}

  

module.exports = Admision;