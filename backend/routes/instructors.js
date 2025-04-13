
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { handleApiError } from '../utils/errorHandler.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get an instructor's courses
router.get('/:id/courses', async (req, res) => {
  try {
    const instructorId = parseInt(req.params.id);
    
    // Get all batches that the instructor teaches
    const batches = await prisma.Batch.findMany({
      where: { instructorId },
      select: { courseId: true }
    });
    
    const courseIds = [...new Set(batches.map(batch => batch.courseId))];
    
    if (courseIds.length === 0) {
      return res.json({ success: true, data: [] });
    }
    
    // Get all courses for these batches
    const courses = await prisma.Course.findMany({
      where: {
        courseId: {
          in: courseIds
        }
      },
      include: {
        category: true,
        _count: {
          select: {
            studentCourses: true,
            batches: true
          }
        }
      }
    });
    
    res.json({ success: true, data: courses });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Get all schedules for an instructor
router.get('/:id/schedules', async (req, res) => {
  try {
    const instructorId = parseInt(req.params.id);
    
    // Get all batches that the instructor teaches
    const batches = await prisma.Batch.findMany({
      where: { instructorId },
      select: { batchId: true }
    });
    
    const batchIds = batches.map(batch => batch.batchId);
    
    if (batchIds.length === 0) {
      return res.json({ success: true, data: [] });
    }
    
    // Get all schedules for these batches
    const schedules = await prisma.Schedule.findMany({
      where: {
        batchId: {
          in: batchIds
        },
        scheduleDate: {
          gte: new Date()
        }
      },
      orderBy: {
        scheduleDate: 'asc',
      },
      include: {
        batch: {
          include: {
            course: true
          }
        }
      }
    });
    
    res.json({ success: true, data: schedules });
  } catch (error) {
    handleApiError(res, error);
  }
});

export default router;
