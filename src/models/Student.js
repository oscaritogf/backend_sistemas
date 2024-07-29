const supabase = require('../config/supabase');
const cloudinary = require('../config/cloudinary');

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
      

        static async updateProfile(id_Usuario, usuarioData) {
          const { Fotografia1, Fotografia2, Fotografia3, Descripcion, ...userData } = usuarioData;
          try {
              // Obtenemos los datos actuales del perfil
              const { data: currentData, error: fetchError } = await supabase
                  .from('Perfiles')
                  .select('*')
                  .eq('id_Usuario', id_Usuario)
                  .single();
  
              if (fetchError) {
                  throw fetchError;
              }
  
              // Subir nuevas imágenes a Cloudinary si se proporcionan
              const uploadToCloudinary = async (file) => {
                  const result = await cloudinary.uploader.upload(file.path);
                  return result.secure_url;
              };
  
              if (Fotografia1 && Fotografia1[0]) {
                  usuarioData.Fotografia1 = await uploadToCloudinary(Fotografia1[0]);
              }
              if (Fotografia2 && Fotografia2[0]) {
                  usuarioData.Fotografia2 = await uploadToCloudinary(Fotografia2[0]);
              }
              if (Fotografia3 && Fotografia3[0]) {
                  usuarioData.Fotografia3 = await uploadToCloudinary(Fotografia3[0]);
              }
  
              // Preparamos los datos para la actualización
              const updateData = {
                  ...currentData,
                  ...usuarioData,
              };
  
              // Actualizamos los datos del perfil
              const { data, error } = await supabase
                  .from('Perfiles')
                  .update(updateData)
                  .eq('id_Usuario', id_Usuario);
  
              if (error) {
                  throw error;
              }
  
              return data;
          } catch (error) {
              console.error('Error al actualizar el perfil:', error);
              return null;
          }
        }

        static async getProfile(id_Usuario) {
          try {
              // Obtenemos los datos del perfil
              const { data, error } = await supabase
                  .from('Perfiles')
                  .select('*')
                  .eq('id_Usuario', id_Usuario)
                  .single();
  
              if (error) {
                  throw error;
              }
  
              return data;
          } catch (error) {
              console.error('Error al obtener el perfil:', error);
              return null;
          }
        }
      

      
      
}

module.exports = Student;