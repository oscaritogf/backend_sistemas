// controllers/departmentHeadController.js
const Jefe = require ('../../models/jefeModels/DepartmentJefe');
const supabase = require('../../config/supabase');

//obtener asignaturas
  exports.getAsignaturas = async (req, res) => {
    try {
      const asignaturas = await Jefe.getAsignaturas();
      res.json({ message: 'Lista de asignaturas', data: asignaturas });
    } catch (error) {
      res.status(500).json({ message: 'Error al obtener la lista de asignaturas', error: error.message });
    }
  };

  exports.getAsignaturasByDepartamento = async (req, res) => {
    const { id_Departamento } = req.params;
    try {
      const asignaturas = await Jefe.getAsignaturasByDepartamento(id_Departamento);
      res.json({ message: `Lista de asignaturas del departamento con id ${id_Departamento}`, data: asignaturas });
    } catch (error) {
      res.status(500).json({ message: 'Error al obtener la lista de asignaturas del departamento con id ${id_Departamento}', error: error.message });
    }
  };

  //obtener edificios
  exports.getEdificios = async (req, res) => {
    try {
      const edificios = await Jefe.getEdificios();
      res.json({ message: 'Lista de edificios', data: edificios });
    } catch (error) {
      res.status(500).json({ message: 'Error al obtener la lista de edificios', error: error.message });
    }
  };

  exports.getEdificiosByCentro = async (req, res) => {
    const { id_Centro } = req.params;
    try {
      const edificios = await Jefe.getEdificiosByCentro(id_Centro);
      res.json({ message: `Lista de departamentos del centro con id ${id_Centro}`, data: edificios });
    } catch (error) {
      res.status(500).json({ message: 'Error al obtener la lista de departamentos del centro con id ${id_Centro}', error: error.message });
    }
  };
  //obtener aulas
  exports.getAulas = async (req, res) => {
    try {
      const aulas = await Jefe.getAulas();
      res.json({ message: 'Lista de aulas', data: aulas });
    } catch (error) {
      res.status(500).json({ message: 'Error al obtener la lista de aulas', error: error.message });
    }
  };

  // Crear secciones
  // exports.insertSeccions = async (req, res) => {
  //     try {
  //         const { id_Docentes, id_Aula, id_Edificios, Hora_inicio, Hora_Final, Cupos } = req.body;
  //         const data = { id_Docentes, id_Aula, id_Edificios, Hora_inicio, Hora_Final, Cupos, };
  
  //         // Verificar la existencia de los valores en la base de datos
  //         await Jefe.existsInTable('empleado', 'numeroEmpleado', data.id_Docentes);
  //         await Jefe.existsInTable('Aula', 'id_Aula', data.id_Aula);
  //         await Jefe.existsInTable('Edificios', 'id_Edficios', data.id_Edificios);
        
  
  //         // Verificar duplicados
  //         await Jefe.isDuplicate(data);
  
  //         // Verificar traslape de horarios
  //         await Jefe.hasTimeConflict(data);
  
  //         // Insertar la sección si todas las validaciones pasan
  //         const seccion = await Jefe.insertSeccions(data);
  
  //         res.json({ message: 'Sección creada', data: seccion });
  
  //     } catch (error) {
  //         console.error('Error al crear la sección:', error);
  //         res.status(400).json({ message: 'Error al crear sección', error: error.message });
  //     }
  // };


  exports.insertSeccions = async (req, res) => {
    try {
        const { id_Docentes, id_Aula, id_Edificios, Hora_inicio, Hora_Final, Cupos, codigoAsignatura, dias, id_Departamento } = req.body;
        let matriculados = 0;

        const data = { id_Docentes, id_Aula, id_Edificios, Hora_inicio, Hora_Final, Cupos, codigoAsignatura, id_Departamento, matriculados };	

        // Verificar la existencia de los valores en la base de datos
        await Jefe.existsInTable('empleado', 'numeroEmpleado', id_Docentes);
        await Jefe.existsInTable('Aula', 'id_Aula', id_Aula);
        await Jefe.existsInTable('Edificios', 'id_Edficios', id_Edificios);

        // Verificar duplicados
        await Jefe.isDuplicate(data);

        // Verificar traslape de horarios
        await Jefe.hasTimeConflict(data);

        // Obtener UV y nombre de la asignatura
        const asignatura = await Jefe.getAsignaturasByCode(codigoAsignatura);

        if (!asignatura) {
            throw new Error('Código de asignatura no válido o sin unidades valorativas.');
        }

        const { uv, nombre } = asignatura;

        // Validar que la cantidad de días proporcionados corresponda a las UV
        if (dias.length !== uv && dias.length !== 1) {
            throw new Error(`La cantidad de días (${dias.length}) no coincide con las unidades valorativas (${uv}).`);
        }

        // Validar que la diferencia entre Hora_inicio y Hora_Final sea igual a las unidades valorativas si hay solo un día
        const horaInicio = new Date(`1970-01-01T${Hora_inicio}Z`);
        const horaFinal = new Date(`1970-01-01T${Hora_Final}Z`);
        const horasDiferencia = (horaFinal - horaInicio) / (1000 * 60 * 60);

        if (dias.length === 1 && horasDiferencia !== uv) {
            throw new Error(`La diferencia entre la hora de inicio y la hora de finalización (${horasDiferencia} horas) debe ser igual a las unidades valorativas (${uv} horas) cuando se asigna a un solo día.`);
        }

        // Insertar la sección y obtener el ID de la nueva sección
        const { data: seccion, error: insertError } = await supabase
            .from('Secciones')
            .insert(data)
            .select('id_Secciones')
            .single();

        if (insertError) {
            throw new Error('Error al insertar la sección: ' + insertError.message);
        }

        // Asignar días a la nueva sección
        for (let dia of dias) {
            const { error: dayInsertError } = await supabase
                .from('seccion_dias')
                .insert({
                    id_seccion: seccion.id_Secciones,
                    id_dia: dia
                });

            if (dayInsertError) {
                throw new Error('Error al asignar días a la sección: ' + dayInsertError.message);
            }
        }

        res.json({ message: 'Sección creada y días asignados', data: seccion, asignatura: nombre });

    } catch (error) {
        console.error('Error al crear la sección:', error);
        res.status(400).json({ message: 'Error al crear sección', error: error.message });
    }
};



exports.getActiveDocentesByDepartment = async (req, res) => {
    try {
        // Extraer el id del departamento del cuerpo de la solicitud
        const { id_Departamento } = req.body;
        
        // Validar que id_Departamento esté presente
        if (!id_Departamento) {
            return res.status(400).json({ message: 'El id del departamento es requerido.' });
        }

        // Obtener la lista de docentes activos por departamento
        const docentes = await Jefe.getActiveDocentesByDepartment(id_Departamento);

        // Enviar respuesta exitosa
        res.json({ message: 'Lista de docentes activos por departamento', data: docentes });
    } catch (error) {
        console.error('Error al obtener la lista de docentes activos por departamento:', error);
        res.status(500).json({ message: 'Error al obtener la lista de docentes activos por departamento', error: error.message });
    }
};


  exports.getDias = async (req, res) => {
    try {
      const dias = await Jefe.getDias();
      res.json({ message: 'Lista de días', data: dias });
    } catch (error) {
      res.status(500).json({ message: 'Error al obtener la lista de días', error: error.message });
    }
  };

  exports.getSecciones = async (req, res) => {
    try {
      const secciones = await Jefe.getSecciones();
      res.json({ message: 'Lista de secciones', data: secciones });
    } catch (error) {
      res.status(500).json({ message: 'Error al obtener la lista de secciones', error: error.message });
    }
  };

  exports.getDocentes = async (req, res) => {
    try {
      const docentes = await Jefe.getDocentes();
      res.json({ message: 'Lista de docentes', data: docentes });
    } catch (error) {
      res.status(500).json({ message: 'Error al obtener la lista de docentes', error: error.message });
    }
  };


  exports.countStudentsByDepartment = async (req, res) => {
    try {
        const result = await Jefe.countStudentsByDepartment();
        res.json({ message: 'Cantidad de estudiantes por departamento', ...result });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener la cantidad de estudiantes en el departamento', error: error.message });
    }
};

// En el módulo Jefe
exports.updateSectionCupos = async (req, res) => {
  try {
    const { id_Seccion, Cupos } = req.body;

    // Verificar que id_Seccion y Cupos sean números válidos
    if (typeof id_Seccion !== 'number' || isNaN(id_Seccion) || typeof Cupos !== 'number' || isNaN(Cupos)) {
      return res.status(400).json({ message: 'id_Seccion y Cupos deben ser números válidos' });
    }

    // Llamar a la función de actualización
    const data = await Jefe.updateSectionCupos(id_Seccion, Cupos);

    // Enviar respuesta con éxito
    res.json({ message: 'Sección actualizada correctamente', data });

  } catch (error) {
    // Manejo de errores
    res.status(500).json({ message: 'Error al actualizar la sección', error: error.message });
  }
};


// exports.getData = async (req, res) => {
//     try {
//       // Aquí iría la lógica para obtener datos del jefe de departamento
//       res.json({ message: 'Datos del jefe de departamento', data: { id: req.user.userId, tipo: 'jefe_departamento' } });
//     } catch (error) {
//       res.status(500).json({ message: 'Error al obtener datos del jefe de departamento', error: error.message });
//     }
//   };