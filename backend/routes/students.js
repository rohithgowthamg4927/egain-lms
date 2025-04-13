
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { handleApiError } from '../utils/errorHandler.js';

const prisma = new PrismaClient();

// ----- /api/students -----
const studentRouter = express.Router();

// Get a student's schedules (all schedules for batches the student is enrolled in)
studentRouter.get('/:id/schedules', async (req, res) => {
  try {
    const studentId = parseInt(req.params.id);

    const studentBatches = await prisma.StudentBatch.findMany({
      where: { studentId },
      select: { batchId: true }
    });

    const batchIds = studentBatches.map(sb => sb.batchId);

    if (batchIds.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const schedules = await prisma.Schedule.findMany({
      where: {
        batchId: { in: batchIds },
        scheduleDate: { gte: new Date() }
      },
      orderBy: { scheduleDate: 'asc' },
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

// Get resources for a student's enrolled batches
studentRouter.get('/:id/resources', async (req, res) => {
  try {
    const studentId = parseInt(req.params.id);

    // Get all batches the student is enrolled in
    const studentBatches = await prisma.StudentBatch.findMany({
      where: { studentId },
      select: { batchId: true }
    });

    const batchIds = studentBatches.map(sb => sb.batchId);

    if (batchIds.length === 0) {
      return res.json({ success: true, data: [] });
    }

    // Get all resources for these batches
    const resources = await prisma.Resource.findMany({
      where: {
        batchId: { in: batchIds }
      },
      orderBy: { createdAt: 'desc' },
      include: {
        batch: {
          include: {
            course: true
          }
        },
        uploadedBy: {
          select: {
            userId: true,
            fullName: true
          }
        }
      }
    });

    res.json({ success: true, data: resources });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Enroll student in a course
studentRouter.post('/:studentId/courses', async (req, res) => {
  try {
    const { studentId, courseId } = req.body;

    const existingEnrollment = await prisma.StudentCourse.findFirst({
      where: {
        studentId: parseInt(studentId),
        courseId: parseInt(courseId)
      }
    });

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        error: 'Student is already enrolled in this course'
      });
    }

    const enrollment = await prisma.StudentCourse.create({
      data: {
        studentId: parseInt(studentId),
        courseId: parseInt(courseId),
        enrollmentDate: new Date()
      }
    });

    res.status(201).json({ success: true, data: enrollment });
  } catch (error) {
    handleApiError(res, error);
  }
});

// ----- /api/student-batches -----
const batchRoutes = express.Router();

batchRoutes.get('/:studentId', async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);

    const studentBatches = await prisma.StudentBatch.findMany({
      where: { studentId },
      include: {
        batch: {
          include: {
            course: true,
            instructor: true
          }
        }
      }
    });

    res.json({ success: true, data: studentBatches });
  } catch (error) {
    handleApiError(res, error);
  }
});

// ----- /api/student-courses -----
const courseRoutes = express.Router();

courseRoutes.get('/:id', async (req, res) => {
  try {
    const studentId = parseInt(req.params.id);

    const studentCourses = await prisma.StudentCourse.findMany({
      where: { studentId },
      include: {
        course: {
          include: {
            category: true,
            reviews: true
          }
        }
      }
    });

    if (!studentCourses.length) {
      return res.status(404).json({
        success: false,
        error: 'No courses found'
      });
    }

    res.json({ success: true, data: studentCourses });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Export everything
export default {
  router: studentRouter,
  batchRoutes,
  courseRoutes
};
