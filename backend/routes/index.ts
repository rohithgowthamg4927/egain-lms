
import express from 'express';
import userRoutes from './users';
import categoryRoutes from './categories';
import courseRoutes from './courses';
import batchRoutes from './batches';
import resourceRoutes from './resources';
import scheduleRoutes from './schedules';
import studentRoutes from './students';
import authRoutes from './auth';
import dashboardRoutes from './dashboard';

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
