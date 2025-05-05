import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

// Route Imports
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import courseRoutes from './routes/courses.js';
import batchRoutes from './routes/batches.js';
import categoryRoutes from './routes/categories.js';
import scheduleRoutes from './routes/schedules.js';
import dashboardRoutes from './routes/dashboard.js';
import studentRoutes from './routes/students.js'; 
import instructorRoutes from './routes/instructors.js';
import resourceRoutes from './routes/resources.js';

// Setup __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// Static folder for file uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/students', studentRoutes.router);
app.use('/api/student-batches', studentRoutes.batchRoutes);
app.use('/api/student-courses', studentRoutes.courseRoutes);
app.use('/api/instructors', instructorRoutes);
app.use('/api/resources', resourceRoutes);

// Root and health check routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Learning Management System API!' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Something went wrong on the server',
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
