
import express from 'express';
import userRoutes from './users.js';
import categoryRoutes from './categories.js';
import courseRoutes from './courses.js';
import batchRoutes from './batches.js';
import resourceRoutes from './resources.js';
import scheduleRoutes from './schedules.js';
import studentRoutes from './students.js';
import authRoutes from './auth.js';
import dashboardRoutes from './dashboard.js';

const router = express.Router();

// Mount auth routes at the root level
router.use('/', authRoutes);

// Mount all other routes
router.use('/users', userRoutes);
router.use('/categories', categoryRoutes);
router.use('/courses', courseRoutes);
router.use('/batches', batchRoutes);
router.use('/resources', resourceRoutes);
router.use('/schedules', scheduleRoutes);
router.use('/student-batches', studentRoutes.batchRoutes);
router.use('/student-courses', studentRoutes.courseRoutes);
router.use('/dashboard', dashboardRoutes); // Now correctly mounted as '/dashboard'

export default router;
