const supabase = require('../config/supabase');

class Student {

        static async putImg1(img, img2, img3, id) {
          try {
            // Primero obtenemos los valores actuales
            const { data: currentData, error: fetchError } = await supabase
              .from('Perfiles')
              .select('Fotografia1, Fotografia2, Fotografia3')
              .eq('id_Usuario', id)
              .single();
      
            if (fetchError) {
              throw fetchError;
            }
      
            // Preparar los valores para la actualización
            const updateData = {
              Fotografia1: img !== "" ? img : currentData.Fotografia1,
              Fotografia2: img2 !== "" ? img2 : currentData.Fotografia2,
              Fotografia3: img3 !== "" ? img3 : currentData.Fotografia3,
            };
      
            // Actualizar los campos en la tabla Perfiles
            const { data, error } = await supabase
              .from('Perfiles')
              .update(updateData)
              .eq('id_Usuario', id);
      
            if (error) {
              throw error;
            }
      
            return data;
          } catch (error) {
            console.error('Error al actualizar el perfil:', error);
            return null;
          }
        }
      
      
  
      
      
}

module.exports = Student;