const supabase = require('../../config/supabase');
const bcrypt = require('bcrypt');
const cloudinary = require('../../config/cloudinary');
const { sendEmployeeWelcomeEmail } = require('../../utils/emailService');

class Jefe {
    //Obtener asignaturas
    static async getAsignaturas() {
        const { data: asignaturas, error } = await supabase
            .from('Asignaturas')
            .select('*');
        return asignaturas;
    }

    //Obtener asignaturas
    static async getAsignaturasByDepartamento(id) {
        const { data: asignaturas, error } = await supabase
            .from('Asignaturas')
            .select('*')
            .eq('id_Departamento', id);
        return asignaturas;
    }

    // Obtener unidades valorativas y nombre de la asignatura por código
static async getAsignaturasByCode(codigoAsignatura) {
    const { data, error } = await supabase
        .from('Asignaturas')
        .select('uv, nombre')
        .eq('codigo', codigoAsignatura)
        .single();
    
    if (error) {
        throw new Error('Error al obtener la asignatura: ' + error.message);
    }

    return data;
}


    // Insertar secciones
    static async insertSeccions(data) {
        // Insertar la sección en la tabla 'Secciones'
        const { data: seccion, error } = await supabase
            .from('Secciones')
            .insert([
                {
                    id_Docentes: data.id_Docentes,
                    id_Aula: data.id_Aula,
                    id_Edificios: data.id_Edificios,
                    Hora_inicio: data.Hora_inicio,
                    Hora_Final: data.Hora_Final,
                    Cupos: data.Cupos
                }
            ])
            .single();
    
        if (error) {
            throw error;
        }
    
        // Retornar el ID de la sección insertada para usarlo en la asignación de días
        return seccion;
    }
    
    static async assignDaysToSection(id_Seccion, numDays) {
        // Verificar que el número de días está en el rango permitido (1 a 7)
        if (numDays < 1 || numDays > 7) {
            throw new Error('El número de días debe estar entre 1 y 7.');
        }
    
        // Crear un arreglo con los días asignados
        const days = Array.from({ length: numDays }, (_, index) => index + 1);
    
        // Preparar los registros para insertar en la tabla seccion_dias
        const seccionDiasRecords = days.map(day => ({
            id_seccion: id_Seccion,
            id_dia: day
        }));
    
        // Insertar los días en la tabla seccion_dias
        const { error } = await supabase
            .from('seccion_dias')
            .upsert(seccionDiasRecords, { onConflict: ['id_seccion', 'id_dia'] });
    
        if (error) {
            throw error;
        }
    }
    

    // Verificar la existencia de un valor en una tabla
    static async existsInTable(table, column, value) {
        const { data, error } = await supabase
            .from(table)
            .select(column)
            .eq(column, value)
            .single();
        if (error || !data) {
            throw new Error(`El valor ${value} no existe en la tabla ${table}.`);
        }
    }

 // Verificar si ya existe una sección con el mismo horario en el mismo aula y edificio
static async isDuplicate(data) {
    const { id_Aula, id_Edificios, Hora_inicio, Hora_Final, id_Docentes } = data;

    // Consulta para encontrar secciones que coincidan en aula, edificio y docente
    const { data: existing, error } = await supabase
        .from('Secciones')
        .select('*')
        .eq('id_Aula', id_Aula)
        .eq('id_Edificios', id_Edificios)
        .eq('id_Docentes', id_Docentes);

    if (error) {
        throw error;
    }

    // Verificar si existe alguna sección que se solape en el tiempo
    const isDuplicate = existing.some(seccion => {
        return (
            (Hora_inicio < seccion.Hora_Final && Hora_Final > seccion.Hora_inicio) // Se solapan
        );
    });

    if (isDuplicate) {
        throw new Error('Ya existe una sección con el mismo horario en el mismo aula, edificio y docente.');
    }
}

    // Verificar si hay traslape de horarios
    static async hasTimeConflict(data) {
        const { id_Docentes, Hora_inicio, Hora_Final, id_Aula, id_Edificios } = data;
    
        // Convertir las horas a objetos Date para una comparación más precisa
        const horaInicio = new Date(`1970-01-01T${Hora_inicio}Z`);
        const horaFinal = new Date(`1970-01-01T${Hora_Final}Z`);
    
        // Obtener las secciones existentes del docente que se solapan en tiempo
        const { data: secciones, error } = await supabase
            .from('Secciones')
            .select('id_Secciones, Hora_inicio, Hora_Final, id_Aula, id_Edificios')
            .eq('id_Docentes', id_Docentes)
            .neq('id_Aula', id_Aula) // Opcional, si no deseas considerar secciones en el mismo aula
            .neq('id_Edificios', id_Edificios) // Opcional, si no deseas considerar secciones en el mismo edificio
            .filter('Hora_inicio', 'lte', Hora_Final)
            .filter('Hora_Final', 'gte', Hora_inicio);
    
        if (error) {
            throw error;
        }
    
        // Verificar si hay conflictos en los horarios
        const conflict = secciones.some(sec => {
            const secInicio = new Date(`1970-01-01T${sec.Hora_inicio}Z`);
            const secFinal = new Date(`1970-01-01T${sec.Hora_Final}Z`);
    
            return horaInicio < secFinal && horaFinal > secInicio;
        });
    
        if (conflict) {
            throw new Error('El docente tiene un conflicto de horario.');
        }
    }
    


    //Obtener secciones
    static async getSecciones() {
        const { data: secciones, error } = await supabase
            .from('Secciones')
            .select('*');
        return secciones;
    }


    //Obtener edificios
    static async getEdificios() {
        const { data: edificios, error } = await supabase
            .from('Edificios')
            .select('*');
        return edificios;
    }
        //Obtener asignaturas
        static async getEdificiosByCentro(id) {
            const { data: edificios, error } = await supabase
                .from('Edificios')
                .select('*')
                .eq('id_Centros', id);
            return edificios;
        }

    //Obtener aulas
    static async getAulas(idEdificio) {
        const { data: aulas, error } = await supabase
            .from('Aula')
            .select('*')
            .eq('id_Edificio', idEdificio); // Filtrar por id_Edificio
        if (error) throw new Error(error.message);
        return aulas;
    }

    static async getDocentes() {
        const { data, error } = await supabase
            .from('empleado')
        .select(`
            *,
            Usuario!inner(*)
                `)
        .eq('Usuario.rol', 'docente');

        if (error) {
            console.error('Error fetching docentes:', error);
        return data;
  }

  console.log('Docentes:', data);
    }

    //Obtener dias
    static async getDias() {
        const { data: dias, error } = await supabase
            .from('Dias')
            .select('*');
        return dias;
    }

// Obtener docentes activos por departamento
static async getActiveDocentesByDepartment(id_Departamento) {
    // Paso 1: Obtener los empleados activos del departamento
    const { data: empleados, error: empleadosError } = await supabase
        .from('empleado')
        .select('usuario, numeroEmpleado')
        .eq('estado', true)
        .eq('id_Departamento', id_Departamento);

    if (empleadosError) {
        throw empleadosError;
    }

    // Paso 2: Obtener los roles de los usuarios y filtrar los docentes
    const usuarios = empleados.map(e => e.usuario);
    const { data: roles, error: rolesError } = await supabase
        .from('UsuarioRol')
        .select('id_Usuario, id_Rol')
        .in('id_Usuario', usuarios);

    if (rolesError) {
        throw rolesError;
    }

    // Paso 3: Obtener la información de Nombre y Apellido de los usuarios
    const idsUsuarios = usuarios;
    const { data: usuariosInfo, error: usuariosInfoError } = await supabase
        .from('Usuario')
        .select('id, Nombre, Apellido')
        .in('id', idsUsuarios);

    if (usuariosInfoError) {
        throw usuariosInfoError;
    }

    // Paso 4: Filtrar docentes que no tienen roles 2 o 4 y combinar nombres
    const docentes = empleados
        .filter(e => 
            !roles.some(r => r.id_Usuario === e.usuario && [2, 4].includes(r.id_Rol))
        )
        .map(e => {
            // Buscar el nombre y apellido del usuario
            const usuarioInfo = usuariosInfo.find(ui => ui.id === e.usuario);
            const nombreDocente = usuarioInfo ? `${usuarioInfo.Nombre} ${usuarioInfo.Apellido}` : 'Desconocido';
            
            return {
                id_Usuario: e.usuario,
                numeroEmpleado: e.numeroEmpleado,
                Nombre_docente: nombreDocente
            };
        });

    return docentes;
}

// Conteo de estudiantes por departamento
static async countStudentsByDepartment() {
    // Paso 1: Obtener los estudiantes y contar por id_Departamento
    const { data: studentData, error: studentError } = await supabase
        .from('estudiante')
        .select('id_Departamento');

    if (studentError) {
        console.error('Error al obtener los estudiantes:', studentError);
        throw studentError;
    }

    // Contar el número de estudiantes por id_Departamento
    const departmentCounts = studentData.reduce((acc, student) => {
        acc[student.id_Departamento] = (acc[student.id_Departamento] || 0) + 1;
        return acc;
    }, {});

    const totalStudents = studentData.length;

    // Obtener los IDs de los departamentos para la siguiente consulta
    const departmentIds = Object.keys(departmentCounts);

    // Paso 2: Obtener los nombres de los departamentos y su id_Facultad
    const { data: departmentData, error: departmentError } = await supabase
        .from('Departamentos')
        .select('id_Departamento, Nombre, id_Facultad')
        .in('id_Departamento', departmentIds.map(Number));

    if (departmentError) {
        console.error('Error al obtener los departamentos:', departmentError);
        throw departmentError;
    }

    // Crear un mapa de id_Departamento a nombre y id_Facultad
    const departmentMap = departmentData.reduce((map, department) => {
        map[department.id_Departamento] = {
            nombre: department.Nombre,
            id_Facultad: department.id_Facultad
        };
        return map;
    }, {});

    // Obtener los IDs de las facultades para la siguiente consulta
    const facultyIds = Array.from(new Set(departmentData.map(d => d.id_Facultad)));

    // Paso 3: Obtener los nombres de las facultades
    const { data: facultyData, error: facultyError } = await supabase
        .from('Facultades')
        .select('id_Facultad, nombre')
        .in('id_Facultad', facultyIds.map(Number));

    if (facultyError) {
        console.error('Error al obtener las facultades:', facultyError);
        throw facultyError;
    }

    // Crear un mapa de id_Facultad a nombre
    const facultyNames = facultyData.reduce((map, faculty) => {
        map[faculty.id_Facultad] = faculty.nombre; // Usa el nombre correcto aquí
        return map;
    }, {});

    // Paso 4: Agrupar los departamentos por facultad
    const facultyDepartments = departmentData.reduce((acc, department) => {
        const facultyId = department.id_Facultad;
        if (!acc[facultyId]) {
            acc[facultyId] = {
                nombre: facultyNames[facultyId] || 'Desconocido',
                departamentos: [],
                cantidad: 0 // Asegurarse de inicializar el campo cantidad
            };
        }
        acc[facultyId].departamentos.push({
            id_Departamento: department.id_Departamento,
            nombre: department.Nombre,
            cantidad: departmentCounts[department.id_Departamento] || 0 // Corregir nombre del campo
        });
        acc[facultyId].cantidad += departmentCounts[department.id_Departamento] || 0; // Corregir nombre del campo
        return acc;
    }, {});

    // Convertir el resultado en un arreglo de objetos JSON
    const resultArray = Object.entries(facultyDepartments).map(([id_Facultad, data]) => ({
        id_Facultad: id_Facultad,
        nombre: data.nombre,
        cantidad: data.cantidad,
        departamentos: data.departamentos
    }));

    return { resultArray, totalStudents };
}

// Supongamos que tienes una instancia de supabase

 static async updateSectionCupos(sectionId, newCupos) {
    try {
        // Actualizar el campo `Cupos` para la sección con el ID proporcionado
        const { data, error } = await supabase
            .from('Secciones')
            .update({ Cupos: newCupos })
            .eq('id_Secciones', sectionId)
            .select();

        if (error) {
            console.error('Error al actualizar los cupos:', error);
            throw error;
        }

        console.log('Cupos actualizados con éxito:', data);
        return data.Cupos;
    } catch (error) {
        console.error('Error en la actualización:', error);
        throw error;
    }


}



};

module.exports = Jefe;
