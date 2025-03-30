
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { handleApiError } from '../utils/errorHandler';

const batchRouter = express.Router();
const courseRouter = express.Router();
const prisma = new PrismaClient();

// Student-Batch Management
batchRouter.post('/', async (req, res) => {
  try {
    const { studentId, batchId } = req.body;
    
    // Check if already enrolled
    const exists = await prisma.studentBatch.findFirst({
      where: { 
        studentId: Number(studentId), 
        batchId: Number(batchId) 
      }
    });
    
    if (exists) {
      return res.status(400).json({
        success: false,
        error: 'Student is already enrolled in this batch'
      });
    }
    
    const enrollment = await prisma.studentBatch.create({
      data: { 
        studentId: Number(studentId), 
        batchId: Number(batchId) 
      }
    });
    
    res.status(201).json({ success: true, data: enrollment });
  } catch (error) {
    handleApiError(res, error);
  }
});

batchRouter.delete('/:studentId/:batchId', async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);
    const batchId = parseInt(req.params.batchId);
    
    await prisma.studentBatch.deleteMany({
      where: { studentId, batchId }
    });
    
    res.status(200).json({ success: true });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Student-Course Management
courseRouter.post('/', async (req, res) => {
  try {
    const { studentId, courseId } = req.body;
    
    // Check if already enrolled
    const exists = await prisma.studentCourse.findFirst({
      where: { 
        studentId: Number(studentId),
        courseId: Number(courseId)
      }
    });
    
    if (exists) {
      return res.status(400).json({
        success: false,
        error: 'Student is already enrolled in this course'
      });
    }
    
    const enrollment = await prisma.studentCourse.create({
      data: { 
        studentId: Number(studentId),
        courseId: Number(courseId)
      }
    });
    
    res.status(201).json({ success: true, data: enrollment });
  } catch (error) {
    handleApiError(res, error);
  }
});

courseRouter.delete('/:studentId/:courseId', async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);
    const courseId = parseInt(req.params.courseId);
    
    await prisma.studentCourse.deleteMany({
      where: { studentId, courseId }
    });
    
    res.status(200).json({ success: true });
  } catch (error) {
    handleApiError(res, error);
  }
});

export default {
  batchRoutes: batchRouter,
  courseRoutes: courseRouter
};
