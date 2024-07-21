const { json } = require('express');
const supabase = require('../config/supabase');
const fs = require('fs').promises; // Importar el módulo fs para trabajar con el sistema de archivos
const { Parser } = require('json2csv');

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


static async getNotasByDNI(dni) {
  const { data, error } = await supabase
    .from('Admisiones')
    .select('id_Carrera, id_Sd_Carrera, nota1, nota2, aprobacionPAM_PCCNS, aprobacionPAA')
    .eq('dni', dni)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

static async getCarreras() {
  const { data, error } = await supabase
    .from('Carrera')
    .select(`
      id_Carrera,
      nombre,
      puntajeRequerido,
      Facultades:Facultades(
        nombre
      )
    `

    );
  
  if (error) {
    throw error;
  }
  
  return data;
}

  static async getCSV() {
    const { data, error } = await supabase
      .from('Admisiones')
      .select('*');
  
    if (error) {
      console.error('Error al obtener datos de Admisiones', error);
      throw error;
    }
  
    if (!data || data.length === 0) {
      throw new Error('No hay datos de Admisiones');
    }
  
    // Obtener datos de la tabla Centros
    const { data: centrosData, error: centrosError } = await supabase
      .from('Centro')
      .select('id_Centro, nombre, codigo');
  
    if (centrosError) {
      console.error('Error al obtener datos de Centros', centrosError);
      throw new Error('Error al obtener datos de Centros');
    }
  
    // Crear un mapa de id_Centro a codigo y nombre
    const centrosMap = new Map();
    const centrocodMap = new Map();
    centrosData.forEach(centro => {
      centrosMap.set(centro.id_Centro, centro.nombre);
      centrocodMap.set(centro.id_Centro, centro.codigo);
    });
  
    // Obtener datos de la tabla Carreras
    const { data: carrerasData, error: carrerasError } = await supabase
      .from('Carrera')
      .select('id_Carrera, nombre, puntajeRequerido');
  
    if (carrerasError) {
      console.error('Error al obtener datos de Carreras', carrerasError);
      throw new Error('Error al obtener datos de Carreras');
    }
  
    // Crear un mapa de id_Carrera a nombre y puntajeRequerido
    const carrerasMap = new Map();
    const puntajeMap = new Map();
    const deptoMap = new Map();
    carrerasData.forEach(carrera => {
      carrerasMap.set(carrera.id_Carrera, carrera.nombre);
      puntajeMap.set(carrera.id_Carrera, carrera.puntajeRequerido);
      deptoMap.set(carrera.id_Carrera, carrera.id_Depto);
    });
  
    // Convertir los datos a formato CSV
    let csv = 'id_Admision,dni,primer_Nombre,segundo_Nombre,primer_Apellido,segundo_Apellido,Centro,Codigo,Carrera,Sd_Carrera,email,intentos,nota1,nota2,aprobacionPAA,aprobacionPAM_PCCNS,matricula,depto\n';
    data.forEach(admision => {
      const cent = centrocodMap.get(admision.id_Centro) || '';
      const codigoCentro = centrosMap.get(admision.id_Centro) || '';
      const nombreCarrera = carrerasMap.get(admision.id_Carrera) || '';
      const nombreSdCarrera = carrerasMap.get(admision.id_Sd_Carrera) || '';
      const deptoCode = deptoMap.get(admision.id_Carrera) || 'ninguno';
  
      // Determinar el valor de matricula
      let matricula = 'ninguna';
      let depto = 'ninguno';
      if (admision.nota1 >= puntajeMap.get(admision.id_Carrera)) {
        matricula = nombreCarrera;
        depto = deptoCode;
      } else if (admision.nota1 >= puntajeMap.get(admision.id_Sd_Carrera)) {
        matricula = nombreSdCarrera;
        depto = deptoCode

      }
  
      csv += `${admision.id_Admision},${admision.dni},${admision.primer_Nombre},${admision.segundo_Nombre},${admision.primer_Apellido},${admision.segundo_Apellido},${codigoCentro},${cent},${nombreCarrera},${nombreSdCarrera},${admision.email},${admision.intentos},${admision.nota1},${admision.nota2},${admision.aprobacionPAA},${admision.aprobacionPAM_PCCNS},${matricula},${depto}\n`;
    });
  
    // Guardar el CSV en un archivo
    try {
      const filePath = 'Admisiones.csv';
      await fs.writeFile(filePath, csv);
      console.log('Archivo CSV de Admisiones creado con éxito.');
    } catch (error) {
      console.error('Error al escribir el archivo CSV', error);
    }
    
    return csv;
  }
  

  static async readCsv(csvFilePath) {
    
  }

  static async generateUniqueStudentNumber(centroNombre) {
    const currentYear = new Date().getFullYear();
    let uniqueNumber;
    let isUnique = false;
  
      const { data: centroData, error: centroError } = await supabase
      .from('Centro')
      .select('codigo')
      .eq('nombre', centroNombre)
      .single();

    if (centroError) throw centroError;

    const centroCode = centroData.codigo;

    while (!isUnique) {
      const randomNum = Math.floor(Math.random() * 9999) + 1;
      uniqueNumber = `${currentYear}${centroCode.toString()}${randomNum.toString().padStart(4, '0')}`;
  
      // Verificar si el número ya existe
      const { data, error } = await supabase
        .from('estudiante')
        .select('numeroCuenta')
        .eq('numeroCuenta', uniqueNumber);
  
      if (error) throw error;
      if (data.length === 0) isUnique = true;
    }
  
    return uniqueNumber;
  }
  
  
  static async getId(dni) {
    const { data, error } = await supabase
      .from('Usuario')
      .select('id, dni')
      .eq('dni', dni);
  
    if (error) throw error;
    return data;
  }

  static async getJSON() {
    const { data, error } = await supabase
      .from('Admisiones')
      .select('*');
  
    if (error) {
      console.error('Error al obtener datos de Admisiones', error);
      throw error;
    }
  
    if (!data || data.length === 0) {
      throw new Error('No hay datos de Admisiones');
    }
  
    // Obtener datos de la tabla Centros
    const { data: centrosData, error: centrosError } = await supabase
      .from('Centro')
      .select('id_Centro, nombre, codigo');
  
    if (centrosError) {
      console.error('Error al obtener datos de Centros', centrosError);
      throw new Error('Error al obtener datos de Centros');
    }
  
    // Crear un mapa de id_Centro a codigo y nombre
    const centrosMap = new Map();
    const centrocodMap = new Map();
    centrosData.forEach(centro => {
      centrosMap.set(centro.id_Centro, centro.nombre);
      centrocodMap.set(centro.id_Centro, centro.codigo);
    });
  
    // Obtener datos de la tabla Carreras
    const { data: carrerasData, error: carrerasError } = await supabase
      .from('Carrera')
      .select('id_Carrera, nombre, puntajeRequerido, id_Depto');
  
    if (carrerasError) {
      console.error('Error al obtener datos de Carreras', carrerasError);
      throw new Error('Error al obtener datos de Carreras');
    }
  
    // Crear un mapa de id_Carrera a nombre, puntajeRequerido y id_Depto
    const carrerasMap = new Map();
    const puntajeMap = new Map();
    const deptoMap = new Map();
    carrerasData.forEach(carrera => {
      carrerasMap.set(carrera.id_Carrera, carrera.nombre);
      puntajeMap.set(carrera.id_Carrera, carrera.puntajeRequerido);
      deptoMap.set(carrera.id_Carrera, carrera.id_Depto);
    });
  
    // Convertir los datos a formato JSON
    const jsonData = data.map(admision => {
      const cent = centrocodMap.get(admision.id_Centro) || '';
      const codigoCentro = centrosMap.get(admision.id_Centro) || '';
      const nombreCarrera = carrerasMap.get(admision.id_Carrera) || '';
      const nombreSdCarrera = carrerasMap.get(admision.id_Sd_Carrera) || '';
      let depto = 'ninguno';
  
      // Determinar el valor de matricula y depto
      let matricula = 'ninguna';
      if (admision.nota1 >= puntajeMap.get(admision.id_Carrera)) {
        matricula = nombreCarrera;
        depto = deptoMap.get(admision.id_Carrera) || 'ninguno';
      } else if (admision.nota1 >= puntajeMap.get(admision.id_Sd_Carrera)) {
        matricula = nombreSdCarrera;
        depto = deptoMap.get(admision.id_Sd_Carrera) || 'ninguno';

      }
  
      return {
        id_Admision: admision.id_Admision,
        dni: admision.dni,
        primer_Nombre: admision.primer_Nombre,
        segundo_Nombre: admision.segundo_Nombre,
        primer_Apellido: admision.primer_Apellido,
        segundo_Apellido: admision.segundo_Apellido,
        Centro: codigoCentro,
        Codigo: cent,
        Carrera: nombreCarrera,
        Sd_Carrera: nombreSdCarrera,
        email: admision.email,
        intentos: admision.intentos,
        nota1: admision.nota1,
        nota2: admision.nota2,
        aprobacionPAA: admision.aprobacionPAA,
        aprobacionPAM_PCCNS: admision.aprobacionPAM_PCCNS,
        matricula: matricula,
        depto: depto
      };
    });
  
    return jsonData;
  }
  

}

  

module.exports = Admision;