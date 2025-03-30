
import express from 'express';
import cors from 'cors';
import userRoutes from './routes/users.js';
import categoryRoutes from './routes/categories.js';
import courseRoutes from './routes/courses.js';
import batchRoutes from './routes/batches.js';
import resourceRoutes from './routes/resources.js';
import scheduleRoutes from './routes/schedules.js';
import studentRoutes from './routes/students.js';
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Use API routes
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/student-batches', studentRoutes.batchRoutes);
app.use('/api/student-courses', studentRoutes.courseRoutes);
app.use('/api/dashboard-metrics', dashboardRoutes);
app.use('/api', authRoutes);

// Add a health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend API running on http://localhost:${PORT}`);
});
