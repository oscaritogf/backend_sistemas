
const supabase = require('../../config/supabase');
const { getCertificacion,getCertificacionVOAE, getCalificacionesGlobal, getCalificacionesPorPeriodo } = require('../../models/estudiante/Certificacion');
const PDFDocument = require('pdfkit');





// DEPENDENCIAS DE PDFMAKE
const pdfMake = require('pdfmake/build/pdfmake');
const pdfFonts = require('pdfmake/build/vfs_fonts');
const fs = require('fs');
const path = require('path');

// Asigna el sistema de archivos virtual a pdfMake
pdfMake.vfs = pdfFonts.pdfMake.vfs;














const timesNewRomanFont = fs.readFileSync(path.join(__dirname, 'fonts', 'TimesNewRomanMTStd.ttf')).toString('base64');
pdfMake.vfs['TimesNewRoman'] = timesNewRomanFont;
const fonts = {
  TimesNewRoman: {
    normal: 'TimesNewRoman',  // Nombre de la fuente en el archivo vfs
    bold: 'TimesNewRoman',
    italics: 'TimesNewRoman',
    bolditalics: 'TimesNewRoman'
  }
};

pdfMake.fonts = fonts;



// Helper function to convert image to base64
const getBase64Image = (imagePath) => {
  const bitmap = fs.readFileSync(imagePath);
  return `data:image/jpeg;base64,${Buffer.from(bitmap).toString('base64')}`;
};


exports.getCertificacionVOAEpdf = async (req, res) => {
  const { numeroCuenta } = req.params;

  const image1Path = path.join(__dirname, 'assets', 'Plantilla1.jpeg');
  const image2Path = path.join(__dirname, 'assets', 'Plantilla2.jpeg');  // Añade la ruta de la segunda imagen
  const imageBase64 = getBase64Image(image1Path);
  const imageBase64_2 = getBase64Image(image2Path);  // Convierte la segunda imagen a base64
  
  try {
    const certificacion = await getCertificacionVOAE(numeroCuenta);

    // Definición del documento PDF
    const docDefinition1 = {
      pageSize: 'A4',
      pageMargins: [30, 172, 30, 25],
      background: [
        {
          image: imageBase64,
          width: 595.28,
          height: 841.89,
        }
      ],
      content: [
        // { text: '0000000', style: 'header', margin: [20, 0, 0, 15], color: 'red' },
        {
          text: `El suscrito Director(a) de la Dirección de Ingreso Permanencia y Promoción de la Universidad Nacional Autónoma de Honduras CERTIFICA QUE ${certificacion.infoEstudiante.nombre}, matriculado(a) con número de cuenta ${numeroCuenta} para la carrera de: ${certificacion.infoEstudiante.departamento}`,
          font: 'TimesNewRoman',
          fontSize: 12,
          lineHeight: 2.2,
          margin: [0, 10, 0, 0]
        },
        {
          text: `obtuvo las siguientes calificaciones:`,
          font: 'TimesNewRoman',
          fontSize: 12,
          margin: [0, 0, 0, 12]
        },
        // Otros contenidos...
        { text: 'CODIGO      ASIGNATURA                                               CALIFICACION       UV', bold: true, lineHeight: 2.0 },

        ...certificacion.registros.flatMap(item => [
          { text: `Año ${item.anio}`, bold: true,  lineHeight: 2.0},
          ...Object.keys(item.periodos).flatMap(periodo => [
            { text: `${periodo}`, bold: true,  lineHeight: 2.0 },
            {
              table: {
                widths: [50, 290, 50, 50, 50],  // Ajustar los anchos si es necesario
                body: [
                  ...item.periodos[periodo].map(calificacion => [
                    { text: calificacion.codigo || '', alignment: 'left', lineHeight: 2.0 },
                    { text: calificacion.nombre || '', alignment: 'left', lineHeight: 2.0 },
                    { text: `${calificacion.nota}       x     ` || '', alignment: 'left', lineHeight: 2.0 },
                    { text: `${calificacion.uv}         =` || '', alignment: 'left', lineHeight: 2.0 },
                    { text: calificacion.notaFinal || '', alignment: 'left', lineHeight: 2.0 },
                  ])
                ]
              },
              layout: 'noBorders'
            }
          ])
        ])

        ,{ text: `.                                                                                                                                     _________________`, bold: true,  margin: [0, -17, 0, 6]  },
        { text: `.                                                                                                                                        ${certificacion.indiceAcademico.totalUV}               ${certificacion.indiceAcademico.totalNotas} `, bold: true, lineHeight: 2.2 },
        { text: `ÍNDICE ACADÉMICO:           (   ${certificacion.indiceAcademico.totalNotas}    )      /     (${certificacion.indiceAcademico.totalUV})    =    ${certificacion.indiceAcademico.indice}   %`, bold: true, lineHeight: 2.0, margin: [0, 0, 0, 15] },

        {
          table: {
            headerRows: 2,
            // keepWithHeaderRows: 1,
            widths: [ '*' ],
            body: [
              [{text: 'TABLA DE CALIFICACIONES',  margin:[0,4,0,5]}],
              [{text: 'DE GRADO', margin:[0,4,0,5]}], 
              [{text: 'Calificación                         Vigente                                                          Normas Académicas', margin:[0,4,0,5]}], 
              [{text: '60%-100%                           Al II Período Académico 2015                   Junio 1970', margin:[0,4,0,5]}], 
              [{text: '65%-100%                           Desde el III Período Académico 2015       Enero 2015 Art.315', margin:[0,4,0,5]}], 
            
              [{text: 'MEDICINA, ENFERMERIA Y ARQUITECTURA', margin:[0,4,0,5]}], 
              [{text: 'Calificación                         Vigente                                                          Normas Académicas', margin:[0,4,0,5]}], 
              [{text: '60%-100%                           Hasta el II Período Académico 2015          Enero 2015 Art.245', margin:[0,4,0,5]}], 
              [{text: '65%-100%                           Desde el I Período Académico 2016           Enero 2015 Art.245', margin:[0,4,0,5]}], 
            
              [{text: 'POSGRADO', margin:[0,4,0,5]}], 
              [{text: 'Calificación                         Vigente                                                          Normas Académicas', margin:[0,4,0,5]}], 
              [{text: '60%-100%                           Reflejados en plan de estudios                    Art.52 reglamentos de posgrado', margin:[0,4,0,5]}], 
              [{text: '65%-100%                           A partír del I período Académico 2018     Art.52 reglamentos de posgrado', margin:[0,4,0,5]}], 
            ]
          },
        },
        {
          text: `INDICE ACADÉMICO: Se obtiene de la sumatoria de las calificaciones obtenidas, multiplicada por las unidades valorativas o créditos dividido entre la totalidad de las unidades valorativas ó créditos académicos obtenidos. Segun las Nomras Acade¿émicas de la UNAH de Enero 2015(Art.188)`,
          font: 'TimesNewRoman',
          fontSize: 12,
          lineHeight: 2.2,
          margin: [0, 12, 0, 0]
        },
        {
          text: `U. V.: La unidad Valorativa es la medida de la intensidad con que se imparte una asignatura.`,
          font: 'TimesNewRoman',
          fontSize: 12,
          lineHeight: 2.2,
        },
        {
          text: `Y, para los fines que al interesado (a) convenga, se extiende la presente en Ciudad Universitaria a los 13 días del mes del mes de febrero del 2024 .`,
          font: 'TimesNewRoman',
          fontSize: 12,
          lineHeight: 2.2,
        },








        

      ],





      header: function(currentPage, pageCount) {
        // Función para generar un número aleatorio de 6 dígitos
        const generateRandomNumber = () => {
          return Math.floor(100000 + Math.random() * 900000);
        };
    
        const randomNumber = generateRandomNumber();
        
        return [
          {
            text: `Página ${currentPage} de ${pageCount}`,
            alignment: 'right',
            fontSize: 15,
            width: 100,
            margin: [0, 112, 15, 0], // Ajusta el margen para posicionar el texto
            background: 'white', // Fondo blanco para el texto
          },
          {
            text: `${randomNumber}${currentPage}`,
            alignment: 'left',
            fontSize: 18,
            color: 'red',
            margin: [50, 15, 0, 0], // Ajusta el margen para posicionar el texto debajo del anterior
          }
        ];
      },
      






    };

    // Definición de la segunda página
    const docDefinition2 = {
      background: {
        image: imageBase64_2,
        width: 595.28,
        height: 841.89,
      },
      content: [
        {
          text: `Este documento pertenece a ${certificacion.infoEstudiante.nombre}`,
          font: 'TimesNewRoman',
          fontSize: 12,
          lineHeight: 2.2,
          margin: [10, 220, 0, 0]
        },
        {
          text: `Con numero de cuenta ${numeroCuenta}, en la carrera de ${certificacion.infoEstudiante.departamento}`,
          font: 'TimesNewRoman',
          fontSize: 12,
          lineHeight: 2.2,
          margin: [10, 0, 0, 0]
        },
        {
          text: `3                                                                                     3`,
          font: 'TimesNewRoman',
          fontSize: 12,
          lineHeight: 2.2,
          margin: [60, 4, 0, 0]
        },
        
        // Aquí puedes añadir más contenido para la segunda página
      ],
      pageMargins: [30, 172, 30, 25],
    };
    

        // Combina las definiciones de los documentos en un solo `docDefinition`
        const docDefinition = {
          pageSize: 'A4',
          pageSize: 'A4',
          pageMargins: [30, 172, 30, 25],
          background: [
            {
              image: imageBase64,
              width: 595.28,
              height: 841.89,
            }
          ],
          content: [
            ...docDefinition1.content,
            { text: '', pageBreak: 'after' }, // Fuerza la creación de una nueva página
            ...docDefinition2.content,
          ],
          header: docDefinition1.header, // Asigna el footer al documento combinado
          background: (currentPage) => {
            if (currentPage === 3) {
              return docDefinition2.background;
            } else {
              return docDefinition1.background;
            }
          },
          styles: {
            header: {
              fontSize: 18,
              bold: true,
              font: 'TimesNewRoman'
            },
            subheader: {
              fontSize: 14,
              bold: true,
              font: 'TimesNewRoman'
            },
            tableHeader: {
              bold: true,
              fontSize: 13,
              color: 'black',
              font: 'TimesNewRoman'
            }
          },
          defaultStyle: {
            font: 'TimesNewRoman'
          }
        };
    

    // Generación del PDF
    const pdfDoc = pdfMake.createPdf(docDefinition);

    // Convertir el PDF a buffer y enviarlo como respuesta
    pdfDoc.getBuffer((buffer) => {
      const fileName = `certificado_${numeroCuenta}.pdf`;

      res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-disposition': `attachment; filename="${fileName}"`,
        'Content-Length': buffer.length,
      });

      res.end(buffer);
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).send('Error generating PDF');
  }
};


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