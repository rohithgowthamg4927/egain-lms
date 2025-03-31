
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { handleApiError } from '../utils/errorHandler.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get dashboard metrics
router.get('/', async (req, res) => {
  try {
    // Get counts for various entities
    const studentsCount = await prisma.user.count({
      where: { role: 'student' }
    });
    
    const instructorsCount = await prisma.user.count({
      where: { role: 'instructor' }
    });
    
    const coursesCount = await prisma.course.count();
    
    const batchesCount = await prisma.batch.count();
    
    const categoriesCount = await prisma.category.count();
    
    const resourcesCount = await prisma.resource.count();
    
    // Get recent batches
    const recentBatches = await prisma.batch.findMany({
      take: 5,
      orderBy: { startDate: 'desc' },
      include: {
        course: true,
        instructor: true,
        students: true
      }
    });
    
    // Get popular courses (by enrollment count)
    const popularCourses = await prisma.course.findMany({
      take: 5,
      include: {
        _count: {
          select: { students: true }
        },
        category: true
      },
      orderBy: {
        students: {
          _count: 'desc'
        }
      }
    });
    
    // Calculate upcoming schedule items
    const now = new Date();
    const upcomingSchedules = await prisma.schedule.findMany({
      take: 5,
      where: {
        startTime: {
          gte: now.toISOString().split('T')[0] // Today or future dates
        }
      },
      orderBy: {
        startTime: 'asc'
      },
      include: {
        batch: {
          include: {
            course: true,
            instructor: true
          }
        }
      }
    });
    
    // Prepare and return metrics
    const metrics = {
      counts: {
        students: studentsCount,
        instructors: instructorsCount,
        courses: coursesCount,
        batches: batchesCount,
        categories: categoriesCount,
        resources: resourcesCount
      },
      recentBatches,
      popularCourses,
      upcomingSchedules
    };
    
    res.json({ success: true, data: metrics });
  } catch (error) {
    handleApiError(res, error);
  }
});

export default router;
