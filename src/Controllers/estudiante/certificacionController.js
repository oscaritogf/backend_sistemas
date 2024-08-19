
const supabase = require('../../config/supabase');
const { getCertificacion,getCertificacionVOAE, getCalificacionesGlobal, getCalificacionesPorPeriodo } = require('../../models/estudiante/Certificacion');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

exports.getCertificacion = async (req, res) => {
  const { id_estudiante } = req.params;
  try {
    const certificacion = await getCertificacion(id_estudiante);
    res.json(certificacion);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getCertificacionVOAE = async (req, res) => {
  const { numeroCuenta } = req.params;
  try {
    const certificacion = await getCertificacionVOAE(numeroCuenta);
    res.json(certificacion);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getCertificacionVOAEpdf = async (req, res) => {

  const { numeroCuenta } = req.params;
  const image1Path = path.join(__dirname, 'assets', 'Plantilla1.jpeg');
  const image2Path = path.join(__dirname, 'assets', 'Plantilla2.jpeg');

  try {
    const certificacion = await getCertificacionVOAE(numeroCuenta);

    res.setHeader('Content-disposition', 'attachment; filename=secciones.pdf');
    res.setHeader('Content-type', 'application/pdf');

    const doc = new PDFDocument({ size: 'A4', margin: 30 });
    doc.pipe(res);
    function addBackgroundImage(doc) {
      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      doc.image(image1Path, 0, 0, { width: pageWidth, height: pageHeight });
    }
    // const pageWidth = doc.page.width;
    // const pageHeight = doc.page.height;
    // doc.image(image1Path, 0, 0, { width: pageWidth, height: pageHeight });

    function styledText(doc, text, options = {}) {
      const fontSize = options.fontSize || 12;
      const marginBottom = 11.2; // Margen inferior en puntos, ajusta según necesites
    
      doc.font('Times-Roman').fontSize(fontSize).text(text, options);
    
      // Aplicar margen inferior después de imprimir el texto
      doc.moveDown(marginBottom / fontSize); // Ajusta el espacio en función del tamaño de fuente
    }
    function addPage() {
      if (doc.page) {
        doc.addPage();
      }
      addBackgroundImage(doc);
    }

    addBackgroundImage(doc); // Agrega la imagen en la primera página



    // doc.fontSize(18).text('Reporte de Secciones', { align: 'center' });
    doc.moveDown( 8);

    doc.font('Times-Roman').fontSize(18).text('0000000', { indent: 20 });
    doc.moveDown();
    
    
    
    styledText(doc, `El suscrito Director(a) de la Dirección de Ingreso Permanencia y Promoción de la universidad Nacional`);
    styledText(doc, `Autónoma Honduras CERTIFICA QUE ${certificacion.infoEstudiante.nombre}, matriculado(a) con número de `);
    styledText(doc, `cuenta ${numeroCuenta} para la carrera de: ${certificacion.infoEstudiante.departamento} obtuvo las siguientes calificaciones:`);
    
    
    // styledText(doc, `El suscrito Director(a) de la Dirección de Ingreso Permanencia y Promoción de la universidad Nacional`);
    // styledText(doc, `Autónoma Honduras CERTIFICA QUE ${certificacion.infoEstudiante.nombre}, matriculado(a) con número de `);
    // styledText(doc, `cuenta ${numeroCuenta} para la carrera de: ${certificacion.infoEstudiante.departamento} obtuvo las siguientes calificaciones:`);
    
    
    // styledText(doc, `El suscrito Director(a) de la Dirección de Ingreso Permanencia y Promoción de la universidad Nacional`);
    // styledText(doc, `Autónoma Honduras CERTIFICA QUE ${certificacion.infoEstudiante.nombre}, matriculado(a) con número de `);
    // styledText(doc, `cuenta ${numeroCuenta} para la carrera de: ${certificacion.infoEstudiante.departamento} obtuvo las siguientes calificaciones:`);
    
    
    // styledText(doc, `El suscrito Director(a) de la Dirección de Ingreso Permanencia y Promoción de la universidad Nacional`);
    // styledText(doc, `Autónoma Honduras CERTIFICA QUE ${certificacion.infoEstudiante.nombre}, matriculado(a) con número de `);
    // styledText(doc, `cuenta ${numeroCuenta} para la carrera de: ${certificacion.infoEstudiante.departamento} obtuvo las siguientes calificaciones:`);
    
    
    // styledText(doc, `El suscrito Director(a) de la Dirección de Ingreso Permanencia y Promoción de la universidad Nacional`);
    // styledText(doc, `Autónoma Honduras CERTIFICA QUE ${certificacion.infoEstudiante.nombre}, matriculado(a) con número de `);
    // styledText(doc, `cuenta ${numeroCuenta} para la carrera de: ${certificacion.infoEstudiante.departamento} obtuvo las siguientes calificaciones:`);
    
    
    // styledText(doc, `El suscrito Director(a) de la Dirección de Ingreso Permanencia y Promoción de la universidad Nacional`);
    // styledText(doc, `Autónoma Honduras CERTIFICA QUE ${certificacion.infoEstudiante.nombre}, matriculado(a) con número de `);
    // styledText(doc, `cuenta ${numeroCuenta} para la carrera de: ${certificacion.infoEstudiante.departamento} obtuvo las siguientes calificaciones:`);
    
    
    // styledText(doc, `El suscrito Director(a) de la Dirección de Ingreso Permanencia y Promoción de la universidad Nacional`);
    // styledText(doc, `Autónoma Honduras CERTIFICA QUE ${certificacion.infoEstudiante.nombre}, matriculado(a) con número de `);
    // styledText(doc, `cuenta ${numeroCuenta} para la carrera de: ${certificacion.infoEstudiante.departamento} obtuvo las siguientes calificaciones:`);
    
    
    // styledText(doc, `El suscrito Director(a) de la Dirección de Ingreso Permanencia y Promoción de la universidad Nacional`);
    // styledText(doc, `Autónoma Honduras CERTIFICA QUE ${certificacion.infoEstudiante.nombre}, matriculado(a) con número de `);
    // styledText(doc, `cuenta ${numeroCuenta} para la carrera de: ${certificacion.infoEstudiante.departamento} obtuvo las siguientes calificaciones:`);
    
    
    // styledText(doc, `El suscrito Director(a) de la Dirección de Ingreso Permanencia y Promoción de la universidad Nacional`);
    // styledText(doc, `Autónoma Honduras CERTIFICA QUE ${certificacion.infoEstudiante.nombre}, matriculado(a) con número de `);
    // styledText(doc, `cuenta ${numeroCuenta} para la carrera de: ${certificacion.infoEstudiante.departamento} obtuvo las siguientes calificaciones:`);
    
    
    // styledText(doc, `El suscrito Director(a) de la Dirección de Ingreso Permanencia y Promoción de la universidad Nacional`);
    // styledText(doc, `Autónoma Honduras CERTIFICA QUE ${certificacion.infoEstudiante.nombre}, matriculado(a) con número de `);
    // styledText(doc, `cuenta ${numeroCuenta} para la carrera de: ${certificacion.infoEstudiante.departamento} obtuvo las siguientes calificaciones:`);
    
    
    // styledText(doc, `El suscrito Director(a) de la Dirección de Ingreso Permanencia y Promoción de la universidad Nacional`);
    // styledText(doc, `Autónoma Honduras CERTIFICA QUE ${certificacion.infoEstudiante.nombre}, matriculado(a) con número de `);
    // styledText(doc, `cuenta ${numeroCuenta} para la carrera de: ${certificacion.infoEstudiante.departamento} obtuvo las siguientes calificaciones:`);
    
    
    
    
    
    
    
    styledText(doc, `    CODIGO                         ASIGNATURA                                CALIFICACION          UV`);

    certificacion.registros.forEach(item => {
      // Añadir el año
      styledText(doc, `Año ${item.anio}`);
      // Recorrer cada periodo dentro del año
      Object.keys(item.periodos).forEach(periodo => {
        // Añadir el nombre del periodo
        styledText(doc, `${periodo}`);
        // Recorrer las calificaciones dentro de cada periodo
        item.periodos[periodo].forEach(calificacion => {
            styledText(doc, `${calificacion.codigo}                               ${calificacion.nombre}                                      ${calificacion.nota}              x               ${calificacion.uv} =            ${calificacion.notaFinal}` );
        });
      });
    });
    doc.end();

  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).send('Error generating PDF');
  }
};


const calcularIndice = (calificaciones) => {
    const totalUV = calificaciones.reduce((sum, { Asignaturas }) => sum + Asignaturas.uv, 0);
    const totalPonderado = calificaciones.reduce((sum, { nota, Asignaturas }) => sum + (nota * Asignaturas.uv), 0);
    
    return totalPonderado / totalUV;
  };
  
  exports.getIndiceGlobal = async (req, res) => {
    const { id_estudiante } = req.params;
    try {
      const calificaciones = await getCalificacionesGlobal(id_estudiante);
      const indiceGlobal = calcularIndice(calificaciones);
        
      res.json({ indiceGlobal });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  exports.putIndiceGlobal = async (req, res) => {
    const { id_estudiante } = req.params;
    try {
      // Obtén las calificaciones globales
      const calificaciones = await getCalificacionesGlobal(id_estudiante);
      
      // Calcula el índice global
      const indiceGlobal = calcularIndice(calificaciones);
      
      // Redondea el índice global al entero más cercano
      const indiceGlobalEntero = Math.round(indiceGlobal);
      
      // Actualiza el índice global del estudiante en la base de datos
      const { data: student, error: errStudent } = await supabase
        .from('estudiante')
        .update({ indice_global: indiceGlobalEntero }) // Enviar el índice redondeado
        .eq('numeroCuenta', id_estudiante);
  
      if (errStudent) throw errStudent;
  
      // Envía la respuesta con el índice global como entero
      res.json({ indiceGlobal: indiceGlobalEntero });
    } catch (error) {
      // Maneja cualquier error
      res.status(500).json({ error: error.message });
    }
  };
  
  exports.getIndicePorPeriodo = async (req, res) => {
    const { id_estudiante, periodo } = req.params;
    try {
      const calificaciones = await getCalificacionesPorPeriodo(id_estudiante, periodo);
      const indicePeriodo = calcularIndice(calificaciones);
      
      res.json({ indicePeriodo });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  exports.putIndicePorPeriodo = async (req, res) => {
    const { id_estudiante, periodo } = req.params;
    try {
      const calificaciones = await getCalificacionesPorPeriodo(id_estudiante, periodo);
      const indicePeriodo = calcularIndice(calificaciones);
      const indicePeriodoEntero = Math.round(indicePeriodo);
      
      const { data: student, error: errStudent } = await supabase
        .from('estudiante')
        .update({ indice_periodo: indicePeriodoEntero })
        .eq('numeroCuenta', id_estudiante);
  
      if (errStudent) throw errStudent;
  
      res.json({ indicePeriodo: indicePeriodoEntero });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
 
  };