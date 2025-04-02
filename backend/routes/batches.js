
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { handleApiError } from '../utils/errorHandler.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all batches with optional filtering by courseId
router.get('/', async (req, res) => {
  try {
    const { courseId } = req.query;
    const whereClause = courseId ? { courseId: parseInt(courseId) } : {};
    
    const batches = await prisma.Batch.findMany({
      where: whereClause,
      include: {
        course: true,
        instructor: true,
        schedules: true,
        students: {
          include: {
            student: true
          }
        }
      }
    });
    
    // Transform data to include studentsCount
    const transformedBatches = batches.map(batch => ({
      ...batch,
      studentsCount: batch.students.length
    }));
    
    res.json({ success: true, data: transformedBatches });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Get batch by ID
router.get('/:id', async (req, res) => {
  try {
    const batchId = parseInt(req.params.id);
    
    const batch = await prisma.Batch.findUnique({
      where: { batchId },
      include: {
        course: true,
        instructor: true,
        schedules: true,
        students: {
          include: {
            student: true
          }
        }
      }
    });
    
    if (!batch) {
      return res.status(404).json({
        success: false,
        error: 'Batch not found'
      });
    }
    
    // Add studentsCount to the response
    const transformedBatch = {
      ...batch,
      studentsCount: batch.students.length
    };
    
    res.json({ success: true, data: transformedBatch });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Get enrolled students for a batch
router.get('/:id/students', async (req, res) => {
  try {
    const batchId = parseInt(req.params.id);
    
    const enrollments = await prisma.StudentBatch.findMany({
      where: { batchId },
      include: {
        student: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Transform data to simplify the response
    const students = enrollments.map(enrollment => ({
      ...enrollment.student,
      enrollmentDate: enrollment.createdAt
    }));
    
    res.json({ success: true, data: students });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Get students not enrolled in a batch (for enrollment options)
router.get('/:id/available-students', async (req, res) => {
  try {
    const batchId = parseInt(req.params.id);
    
    // Find students not enrolled in this batch
    const students = await prisma.User.findMany({
      where: {
        role: 'student',
        NOT: {
          studentBatches: {
            some: {
              batchId
            }
          }
        }
      }
    });
    
    res.json({ success: true, data: students });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Create a new batch
router.post('/', async (req, res) => {
  try {
    const { 
      batchName,
      startDate,
      endDate,
      courseId,
      instructorId
    } = req.body;
    
    const batch = await prisma.Batch.create({
      data: {
        batchName,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        courseId: parseInt(courseId),
        instructorId: parseInt(instructorId)
      }
    });
    
    res.status(201).json({ success: true, data: batch });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Update a batch
router.put('/:id', async (req, res) => {
  try {
    const batchId = parseInt(req.params.id);
    const { 
      batchName,
      startDate,
      endDate,
      courseId,
      instructorId
    } = req.body;
    
    const batch = await prisma.Batch.update({
      where: { batchId },
      data: {
        ...(batchName !== undefined && { batchName }),
        ...(startDate !== undefined && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && { endDate: new Date(endDate) }),
        ...(courseId !== undefined && { courseId: parseInt(courseId) }),
        ...(instructorId !== undefined && { instructorId: parseInt(instructorId) })
      }
    });
    
    res.json({ success: true, data: batch });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Delete a batch
router.delete('/:id', async (req, res) => {
  try {
    const batchId = parseInt(req.params.id);
    
    // Delete student enrollments
    await prisma.StudentBatch.deleteMany({
      where: { batchId }
    });
    
    // Delete batch schedules
    await prisma.Schedule.deleteMany({
      where: { batchId }
    });
    
    // Delete the batch
    await prisma.Batch.delete({
      where: { batchId }
    });
    
    res.json({ success: true });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Enroll student in a batch
router.post('/:id/students', async (req, res) => {
  try {
    const batchId = parseInt(req.params.id);
    const { studentId } = req.body;
    
    // Check if batch exists
    const batch = await prisma.Batch.findUnique({
      where: { batchId },
      include: {
        students: true,
        course: true
      }
    });
    
    if (!batch) {
      return res.status(404).json({
        success: false,
        error: 'Batch not found'
      });
    }
    
    // Check if student is already enrolled
    const alreadyEnrolled = batch.students.some(s => s.studentId === parseInt(studentId));
    
    if (alreadyEnrolled) {
      return res.status(400).json({
        success: false,
        error: 'Student is already enrolled in this batch'
      });
    }
    
    // Enroll student
    const enrollment = await prisma.StudentBatch.create({
      data: {
        studentId: parseInt(studentId),
        batchId,
        createdAt: new Date()
      }
    });
    
    // Also enroll student in the course if not already enrolled
    const studentCourse = await prisma.StudentCourse.findFirst({
      where: {
        studentId: parseInt(studentId),
        courseId: batch.courseId
      }
    });
    
    if (!studentCourse) {
      await prisma.StudentCourse.create({
        data: {
          studentId: parseInt(studentId),
          courseId: batch.courseId,
          createdAt: new Date()
        }
      });
    }
    
    res.status(201).json({ success: true, data: enrollment });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Remove student from a batch
router.delete('/:batchId/students/:studentId', async (req, res) => {
  try {
    const batchId = parseInt(req.params.batchId);
    const studentId = parseInt(req.params.studentId);
    
    // Check if enrollment exists
    const enrollment = await prisma.StudentBatch.findFirst({
      where: {
        batchId,
        studentId
      }
    });
    
    if (!enrollment) {
      return res.status(404).json({
        success: false,
        error: 'Student is not enrolled in this batch'
      });
    }
    
    // Remove enrollment
    await prisma.StudentBatch.deleteMany({
      where: {
        batchId,
        studentId
      }
    });
    
    res.json({ success: true });
  } catch (error) {
    handleApiError(res, error);
  }
});

export default router;
