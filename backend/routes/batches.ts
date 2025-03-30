
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { handleApiError } from '../utils/errorHandler.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all batches
router.get('/', async (req, res) => {
  try {
    const courseId = req.query.courseId ? parseInt(req.query.courseId as string) : undefined;
    
    const batches = await prisma.batch.findMany({
      where: courseId ? { courseId } : undefined,
      include: {
        course: {
          include: { category: true }
        },
        instructor: true,
        students: true
      }
    });
    
    const enrichedBatches = batches.map(batch => ({
      ...batch,
      students: batch.students.length,
      studentsCount: batch.students.length
    }));
    
    res.status(200).json({ success: true, data: enrichedBatches });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Get a specific batch
router.get('/:batchId', async (req, res) => {
  try {
    const batchId = parseInt(req.params.batchId);
    
    const batch = await prisma.batch.findUnique({
      where: { batchId },
      include: {
        course: {
          include: { category: true }
        },
        instructor: true,
        students: true,
        schedules: true
      }
    });
    
    if (!batch) {
      return res.status(404).json({ success: false, error: 'Batch not found' });
    }
    
    const enrichedBatch = {
      ...batch,
      students: batch.students.length,
      studentsCount: batch.students.length
    };
    
    res.status(200).json({ success: true, data: enrichedBatch });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Create a batch
router.post('/', async (req, res) => {
  try {
    console.log("Creating batch with data:", req.body);
    const batchData = req.body;
    
    // Validate that the required fields exist
    if (!batchData.batchName || !batchData.courseId || !batchData.instructorId || 
        !batchData.startDate || !batchData.endDate) {
      return res.status(400).json({ 
        success: false, 
        error: 'Required fields missing for batch creation' 
      });
    }
    
    // Create the batch
    const newBatch = await prisma.batch.create({
      data: {
        batchName: batchData.batchName,
        courseId: Number(batchData.courseId),
        instructorId: Number(batchData.instructorId),
        startDate: new Date(batchData.startDate),
        endDate: new Date(batchData.endDate)
      },
      include: {
        course: true,
        instructor: true
      }
    });
    
    console.log("Batch created successfully:", newBatch);
    
    res.status(201).json({ success: true, data: newBatch });
  } catch (error) {
    console.error("Error creating batch:", error);
    handleApiError(res, error);
  }
});

export default router;
