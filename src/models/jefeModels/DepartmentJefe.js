const supabase = require('../../config/supabase');
const bcrypt = require('bcrypt');
const cloudinary = require('../../config/cloudinary');
const { sendEmployeeWelcomeEmail, sendResetMail } = require('../../utils/emailService');
const crypto = require('crypto');

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
        //numero aleatorio para la contraseña del chat
        randomPass = (Math.floor(Math.random() * 90000) + 10000).toString();

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
                    Cupos: data.Cupos,
                    estado: true,
                    contrasenaChat: randomPass
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
            throw new Error(`Ingresa un valor en el campo para ${table}.`);
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

    // Validar que los campos Hora_inicio y Hora_Final no estén vacíos
    if (!Hora_inicio || !Hora_Final) {
        throw new Error('Los campos de Hora Inicio y Hora Final son obligatorios.');
    }

    // Validar que Hora_Final sea mayor que Hora_inicio
    const horaInicio = new Date(`1970-01-01T${Hora_inicio}Z`);
    const horaFinal = new Date(`1970-01-01T${Hora_Final}Z`);
    if (horaFinal <= horaInicio) {
        throw new Error('La Hora Final debe ser mayor que la Hora Inicio.');
    }

    // Obtener las secciones existentes del docente que se solapan en tiempo
    const { data: secciones, error } = await supabase
        .from('Secciones')
        .select('id_Secciones, Hora_inicio, Hora_Final, id_Aula, id_Edificios')
        .eq('id_Docentes', id_Docentes)
        .neq('id_Edificios', id_Edificios) // Opcional, si no deseas considerar secciones en el mismo edificio
        .neq('id_Aula', id_Aula) // Opcional, si no deseas considerar secciones en el mismo aula
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
            .select('*')
            .eq('estado', true);
        return secciones;
    }
   //Obtener secciones por el codigo de la asignatura
   static async getSeccionesByAsignatura(codigo) {
    const { data: secciones, error } = await supabase
        .from('Secciones')
        .select('*')
        .eq('codigoAsignatura', codigo)
        .eq('estado', true);
        
    return secciones;
}

static async getSeccionesFiltro(id_Secciones) {
    const { data: secciones, error } = await supabase
        .from('Secciones')
        .select('*')
        .eq('id_Secciones', id_Secciones)
        .eq('estado', true);
        
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
    static async getAulasByEdificio(idEdificio) {
        const { data: aulas, error } = await supabase
            .from('Aula')
            .select('*')
            .eq('id_Edificio', idEdificio); // Filtrar por id_Edificio
        if (error) throw new Error(error.message);
        return aulas;
    }

    static async getAulas() {
        const { data: aulas, error } = await supabase
            .from('Aula')
            .select('*')
        if (error) throw new Error(error.message);
        return aulas;
    }
    static async getTiposAulas() {
        const { data: aulas, error } = await supabase
            .from('TiposAula')
            .select('*')
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
        .select('usuario, numeroEmpleado, Usuario(Correo, Nombre)')
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
                Nombre_docente: nombreDocente,
                correo: e.Usuario.Correo
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
            // Obtener el valor actual de Cupos
            let { data: section, error: fetchError } = await supabase
                .from('Secciones')
                .select('Cupos')
                .eq('id_Secciones', sectionId)
                .single();

            if (fetchError) {
                console.error('Error al obtener el valor actual de Cupos:', fetchError);
                throw fetchError;
            }

            // Sumar newCupos al valor actual de Cupos
            const updatedCupos = section.Cupos + newCupos;

            // Actualizar el campo Cupos con el nuevo valor
            const { data, error } = await supabase
                .from('Secciones')
                .update({ Cupos: updatedCupos })
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



    //Justificacion para cancelar una seccion
    static async justificarCancelacionSeccion(id_Secciones) {
        // Primero, elimina los registros de la tabla 'seccion_dias' relacionados con 'id_Secciones'
        const { error: errorSeccionDias } = await supabase
            .from('seccion_dias')
            .delete()
            .eq('id_seccion', id_Secciones);
    
        if (errorSeccionDias) {
            throw errorSeccionDias;
        }
    
        // Luego, elimina el registro de la tabla 'Secciones'
        const { data, error: errorSecciones } = await supabase
            .from('Secciones')
            .delete()
            .eq('id_Secciones', id_Secciones)
            .single();
    
        if (errorSecciones) {
            throw errorSecciones;
        }
    
        return data;
    }
    

    //generar y guardar el token de reinicio de contraseña

 static async requestPasswordReset(id, email) {
  const token = crypto.randomBytes(32).toString('hex');
  const expirationTime = new Date();
  expirationTime.setMinutes(expirationTime.getMinutes() + 2); // Token válido por 2 minutos

  // Guardar el token y la hora de expiración en la base de datos
  const { data, error } = await supabase
    .from('Usuario')
    .update({ reset_token: token, token_expiration: expirationTime.toISOString() })
    .eq('id', id);



  if (error) {
    console.error('Error updating user with reset token:', error);
    return;
  }

  // Enviar correo electrónico con el enlace de reinicio (implementa tu función sendResetEmail)
  await sendResetMail(email, token);
}

static async Reset(token, newPassword) {
    const { data, error } = await supabase
        .from('Usuario')
        .select('id, token_expiration')    
        .eq('reset_token', token)
        .single();

        if (error) {
            console.error('Error fetching user with reset token:', error);
            return;
        }

        const expirationTime = new Date(data.token_expiration);

        const currentTime = new Date().toISOString();

        console.log('current UTC', currentTime);

        if (currentTime > expirationTime.toISOString()) {
            throw new Error('El token de reinicio ha expirado.');
            return {message:'Error al cambiar la contraseña' ,error: 'El token de reinicio ha expirado.'};
        }

        // Actualizar la contraseña del usuario
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const { error: updateError } = await supabase
            .from('Usuario')
            .update({ Contrasena: hashedPassword, reset_token: null, token_expiration: null })
            .eq('id', data.id);

        if (updateError) {
            console.error('Error updating user password:', updateError);
            return;
        }
        console.log(currentTime);
        console.log(expirationTime);
        console.log('Contraseña actualizada con éxito.');



}

static async updateSeccion(data) {
    const { id_Secciones, id_Docentes, id_Aula, id_Edificios, Hora_inicio, Hora_Final, dias } = data;

    // Validar que la Hora_Final sea mayor que la Hora_inicio
    const newStartTime = new Date(`1970-01-01T${Hora_inicio}`);
    const newEndTime = new Date(`1970-01-01T${Hora_Final}`);
    if (newEndTime <= newStartTime) {
        throw new Error("La Hora_Final debe ser mayor que la Hora_inicio");
    }

    // Obtener los datos de la sección existente
    const { data: existingSection, error: existingSectionError } = await supabase
        .from('Secciones')
        .select('Hora_inicio, Hora_Final')
        .eq('id_Secciones', id_Secciones)
        .single();

    if (existingSectionError) {
        throw existingSectionError;
    }

    // Calcular la diferencia de horas original
    const originalStartTime = new Date(`1970-01-01T${existingSection.Hora_inicio}`);
    const originalEndTime = new Date(`1970-01-01T${existingSection.Hora_Final}`);
    const originalHourDifference = (originalEndTime - originalStartTime) / (1000 * 60 * 60); // Diferencia en horas original

    // Calcular la diferencia de horas nueva
    const newHourDifference = (newEndTime - newStartTime) / (1000 * 60 * 60); // Diferencia en horas nueva

    // Obtener la cantidad de días existentes para la sección
    const { data: existingDays, error: existingDaysError } = await supabase
        .from('seccion_dias')
        .select('id_dia')
        .eq('id_seccion', id_Secciones);

    if (existingDaysError) {
        throw existingDaysError;
    }

    const numExistingDays = existingDays.length;

    // Verificar si la cantidad de días es diferente
    if (dias.length !== numExistingDays) {
        if (numExistingDays === 1 && dias.length > 1) {
            // Cambiar de un día a varios días
            if (dias.length !== originalHourDifference) {
                throw new Error(`La cantidad de días nuevos (${dias.length}) debe ser igual a la diferencia de horas original (${originalHourDifference}).`);
            }

            const newHourPerDay = originalHourDifference / dias.length;
            if (newHourPerDay * dias.length !== originalHourDifference) {
                throw new Error(`La nueva diferencia de horas por día (${newHourPerDay}) multiplicada por la cantidad de días nuevos (${dias.length}) debe ser igual a la diferencia de horas original (${originalHourDifference}).`);
            }
        } else if (dias.length !== numExistingDays) {
            // Cambiar de varios días a uno o diferente cantidad de días
            if (!(dias.length === 1 && newHourDifference >= numExistingDays)) {
                throw new Error(`La cantidad de días no coincide con la cantidad original y la diferencia de horas no es suficiente para compensar. Se requiere una diferencia de al menos ${numExistingDays} horas.`);
            }
        }
    }

    // Verificar si hay traslape de horarios
    await Jefe.hasTimeConflict(data);

    // Actualizar la sección con los nuevos datos
    const { data: seccion, error } = await supabase
        .from('Secciones')
        .update({
            id_Docentes,
            id_Aula,
            id_Edificios,
            Hora_inicio,
            Hora_Final
        })
        .eq('id_Secciones', id_Secciones)
        .single();

    if (error) {
        throw error;
    }

    // Eliminar los días existentes para la sección
    const { error: deleteError } = await supabase
        .from('seccion_dias')
        .delete()
        .eq('id_seccion', id_Secciones);

    if (deleteError) {
        throw deleteError;
    }

    // Insertar los nuevos días
    const insertData = dias.map(dia => ({
        id_seccion: id_Secciones,
        id_dia: dia
    }));

    const { error: insertError } = await supabase
        .from('seccion_dias')
        .insert(insertData);

    if (insertError) {
        throw insertError;
    }

    return seccion;
}

}
module.exports = Jefe;
