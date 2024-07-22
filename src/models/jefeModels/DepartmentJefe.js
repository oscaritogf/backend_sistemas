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
    

    //Obtener aulas
    static async getAulas() {
        const { data: aulas, error } = await supabase
            .from('Aula')
            .select('*');
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






};

module.exports = Jefe;