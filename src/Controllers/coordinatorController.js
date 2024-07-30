const Coordinador = require('../models/Coordinador');
const supabase = require('../config/supabase');
const XLSX = require('xlsx');
const PDFDocument = require('pdfkit');


exports.getData = async (req, res) => {
    try {
      // Aquí iría la lógica para obtener datos del coordinador
      res.json({ message: 'Datos del coordinador', data: { id: req.user.userId, tipo: 'coordinador' } });
    } catch (error) {
      res.status(500).json({ message: 'Error al obtener datos del coordinador', error: error.message });
    }
  };

exports.getSeccionesByDepartamento = async (req, res) => {
    try {
        const { id_Departamento } = req.body;
        const secciones = await Coordinador.getSeccionesByDepartamento(id_Departamento);
        res.json({ message: 'Secciones del departamento', data: secciones });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener las secciones del departamento', error: error.message });
    }
};

 // Asegúrate de ajustar el path según tu estructura de proyecto
 
 exports.saveSeccionesPdf = async (req, res) => {
   const {  id_Departamento } = req.body; // Asegúrate de obtener el id_Departamento de los parámetros
 
   try {
     const secciones = await Coordinador.getSeccionesByDepartamento(id_Departamento);
 
     // Configurar la respuesta para descargar el PDF
     res.setHeader('Content-disposition', 'attachment; filename=secciones.pdf');
     res.setHeader('Content-type', 'application/pdf');
 
     const doc = new PDFDocument();
 
     doc.pipe(res);
 
     // Añadir contenido al PDF
     doc.fontSize(18).text('Reporte de Secciones', { align: 'center' });
     doc.moveDown();
 
     secciones.forEach(seccion => {
       doc.fontSize(12).text(`Sección ID: ${seccion.id_Secciones}`);
       doc.text(`Asignatura: ${seccion.Asignaturas.nombre} (${seccion.Asignaturas.codigo})`);
       doc.text(`Número de Empleado: ${seccion.id_Docentes}`);
       doc.text(`Docente: ${seccion.empleado.usuario.Nombre} ${seccion.empleado.usuario.Apellido}`);
       doc.text(`Edificio: ${seccion.id_Edificios}`);
       doc.text(`Aula: ${seccion.id_Aula}`);
       doc.text(`Cupos: ${seccion.Cupos}`);
       doc.text(`Estudiantes Matriculados: ${seccion.matriculados}`);
       doc.moveDown();
     });
 
     doc.end();
   } catch (error) {
     console.error('Error generating PDF:', error);
     res.status(500).send('Error generating PDF');
   }
 };
 

exports.saveSeccionesExcel = async (req, res) => {
  const { id_Departamento } = req.body;

  try {
    const secciones = await Coordinador.getSeccionesByDepartamento(id_Departamento);

    // Crear una nueva hoja de trabajo
    const worksheetData = [
      [],
      ['Reporte de Secciones'],
      [],
      [
        'Sección ID',
        'Código Asignatura',
        'Nombre Asignatura',
        'Numero de Empleado',
        'Nombre Docente',
        'Apellido Docente',
        'Edificio',
        'Aula',
        'Cupos',
        'Estudiantes Matriculados'
      ]
    ];

    // Añadir filas
    secciones.forEach(seccion => {
      worksheetData.push([
        seccion.id_Secciones,
        seccion.Asignaturas.codigo,
        seccion.Asignaturas.nombre,
        seccion.id_Docentes.toString(),
        seccion.empleado.usuario.Nombre,
        seccion.empleado.usuario.Apellido,
        seccion.id_Edificios,
        seccion.id_Aula,
        seccion.Cupos,
        seccion.matriculados
      ]);
    });

    // Crear el libro y la hoja de trabajo
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Secciones');

    worksheet['!merges'] = [
      { s: { r: 1, c: 0 }, e: { r: 1, c: 9 } }
    ];

    worksheet['A2'].s = {
      font: { bold: true, sz: 18, alignment: { horizontal: 'center' } },
      alignment: { horizontal: 'center', vertical: 'center' } 
    }

    worksheet['!cols'] = [
      { wch: 10 },
      { wch: 18 },
      { wch: 34 },
      { wch: 18 },
      { wch: 20 },
      { wch: 20 },
      { wch: 7 },
      { wch: 7 },
      { wch: 7 },
      { wch: 20 }
    ];


    // Escribir el archivo en un buffer
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    // Configurar la respuesta para descargar el Excel
    res.setHeader('Content-Disposition', 'attachment; filename=secciones.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    // Enviar el buffer como respuesta
    res.send(excelBuffer);
  } catch (error) {
    console.error('Error generating Excel:', error);
    res.status(500).send('Error generating Excel');
  }
};






