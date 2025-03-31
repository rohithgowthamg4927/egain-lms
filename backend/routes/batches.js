
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { handleApiError } from '../utils/errorHandler.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all batches
router.get('/', async (req, res) => {
  try {
    const batches = await prisma.batch.findMany({
      include: {
        course: true,
        instructor: true,
        schedule: true,
        students: {
          include: {
            student: true
          }
        }
      }
    });
    
    res.json({ success: true, data: batches });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Get batch by ID
router.get('/:id', async (req, res) => {
  try {
    const batchId = parseInt(req.params.id);
    
    const batch = await prisma.batch.findUnique({
      where: { batchId },
      include: {
        course: true,
        instructor: true,
        schedule: true,
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
    
    res.json({ success: true, data: batch });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Create a new batch
router.post('/', async (req, res) => {
  try {
    const { 
      name,
      startDate,
      endDate,
      courseId,
      instructorId,
      capacity,
      meetingLink
    } = req.body;
    
    const batch = await prisma.batch.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        courseId: parseInt(courseId),
        instructorId: instructorId ? parseInt(instructorId) : null,
        capacity: parseInt(capacity),
        meetingLink
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
      name,
      startDate,
      endDate,
      courseId,
      instructorId,
      capacity,
      meetingLink
    } = req.body;
    
    const batch = await prisma.batch.update({
      where: { batchId },
      data: {
        ...(name !== undefined && { name }),
        ...(startDate !== undefined && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && { endDate: new Date(endDate) }),
        ...(courseId !== undefined && { courseId: parseInt(courseId) }),
        ...(instructorId !== undefined && { instructorId: instructorId ? parseInt(instructorId) : null }),
        ...(capacity !== undefined && { capacity: parseInt(capacity) }),
        ...(meetingLink !== undefined && { meetingLink })
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
    await prisma.studentBatch.deleteMany({
      where: { batchId }
    });
    
    // Delete batch schedules
    await prisma.schedule.deleteMany({
      where: { batchId }
    });
    
    // Delete the batch
    await prisma.batch.delete({
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
    const batch = await prisma.batch.findUnique({
      where: { batchId },
      include: {
        students: true
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
    
    // Check if batch is at capacity
    if (batch.students.length >= batch.capacity) {
      return res.status(400).json({
        success: false,
        error: 'Batch is at full capacity'
      });
    }
    
    // Enroll student
    const enrollment = await prisma.studentBatch.create({
      data: {
        studentId: parseInt(studentId),
        batchId,
        enrollmentDate: new Date()
      }
    });
    
    // Also enroll student in the course if not already enrolled
    const studentCourse = await prisma.studentCourse.findFirst({
      where: {
        studentId: parseInt(studentId),
        courseId: batch.courseId
      }
    });
    
    if (!studentCourse) {
      await prisma.studentCourse.create({
        data: {
          studentId: parseInt(studentId),
          courseId: batch.courseId,
          enrollmentDate: new Date()
        }
      });
    }
    
    res.status(201).json({ success: true, data: enrollment });
  } catch (error) {
    handleApiError(res, error);
  }
});

export default router;
