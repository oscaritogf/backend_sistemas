require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express(); // Mueve esta línea aquí
const admisionesRoutes = require('./routes/admisiones');
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/student');
const teacherRoutes = require('./routes/teacher');
const coordinatorRoutes = require('./routes/coordinator');
const departmentHeadRoutes = require('./routes/departmentHead');
const adminRoutes = require('./routes/admin');
const matriculaRoutes = require('./routes/matricula');
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/coordinator', coordinatorRoutes);
app.use('/api/department-head', departmentHeadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admisiones', admisionesRoutes);
app.use('/api/matricula', matriculaRoutes)
const port = process.env.PORT || 3000;



// Ruta de que funciona el backend
app.get('/', (req, res) => {
  res.json({ message: 'Backend funcionando correctamente' });
});



app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
/**jose */
