require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express(); // Mueve esta línea aquí

const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/student');
const teacherRoutes = require('./routes/teacher');
const coordinatorRoutes = require('./routes/coordinator');
const departmentHeadRoutes = require('./routes/departmentHead');
const adminRoutes = require('./routes/admin');
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/coordinator', coordinatorRoutes);
app.use('/api/department-head', departmentHeadRoutes);
app.use('/api/admin', adminRoutes);

const port = process.env.PORT || 3000;



// Ruta de ejemplo
app.get('/', (req, res) => {
  res.json({ message: 'Backend funcionando correctamente' });
});

// Ejemplo de ruta que interactúa con Supabase
app.get('/datos', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tu_tabla')
      .select('*');
    
    if (error) throw error;
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
