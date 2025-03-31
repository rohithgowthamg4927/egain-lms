
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { handleApiError } from '../utils/errorHandler.js';

const prisma = new PrismaClient();

// Create student batch routes
const batchRoutes = express.Router();

// Get all batches for a student
batchRoutes.get('/:studentId', async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);
    
    const studentBatches = await prisma.studentBatch.findMany({
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

// Create student course routes
const courseRoutes = express.Router();

// Get all courses for a student
courseRoutes.get('/:studentId', async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);
    
    const studentCourses = await prisma.studentCourse.findMany({
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
    
    res.json({ success: true, data: studentCourses });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Enroll student in a course
courseRoutes.post('/', async (req, res) => {
  try {
    const { studentId, courseId } = req.body;
    
    // Check if student is already enrolled
    const existingEnrollment = await prisma.studentCourse.findFirst({
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
    
    // Create enrollment
    const enrollment = await prisma.studentCourse.create({
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

export default {
  batchRoutes,
  courseRoutes
};
