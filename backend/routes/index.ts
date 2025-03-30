
import express from 'express';
import userRoutes from './users/index.js';
import categoryRoutes from './categories.js';
import courseRoutes from './courses.js';
import batchRoutes from './batches.js';
import resourceRoutes from './resources.js';
import scheduleRoutes from './schedules.js';
import studentRoutes from './students.js';
import authRoutes from './auth.js';
import dashboardRoutes from './dashboard.js';

const router = express.Router();

// Mount all routes
router.use('/users', userRoutes);
router.use('/categories', categoryRoutes);
router.use('/courses', courseRoutes);
router.use('/batches', batchRoutes);
router.use('/resources', resourceRoutes);
router.use('/schedules', scheduleRoutes);
router.use('/student-batches', studentRoutes.batchRoutes);
router.use('/student-courses', studentRoutes.courseRoutes);
router.use('/dashboard-metrics', dashboardRoutes);
router.use('/', authRoutes);

export default router;
