
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { handleApiError } from '../utils/errorHandler.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all schedules
router.get('/', async (req, res) => {
  try {
    const schedules = await prisma.schedule.findMany({
      include: {
        batch: {
          include: {
            course: true,
            instructor: true
          }
        }
      }
    });
    
    res.json({ success: true, data: schedules });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Get schedules for a specific batch
router.get('/batch/:batchId', async (req, res) => {
  try {
    const batchId = parseInt(req.params.batchId);
    
    const schedules = await prisma.schedule.findMany({
      where: { batchId },
      orderBy: { startTime: 'asc' }
    });
    
    res.json({ success: true, data: schedules });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Get schedule by ID
router.get('/:id', async (req, res) => {
  try {
    const scheduleId = parseInt(req.params.id);
    
    const schedule = await prisma.schedule.findUnique({
      where: { scheduleId },
      include: {
        batch: {
          include: {
            course: true,
            instructor: true
          }
        }
      }
    });
    
    if (!schedule) {
      return res.status(404).json({
        success: false,
        error: 'Schedule not found'
      });
    }
    
    res.json({ success: true, data: schedule });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Create a new schedule
router.post('/', async (req, res) => {
  try {
    const { 
      title,
      description,
      startTime,
      endTime,
      day,
      batchId,
      meetingLink
    } = req.body;
    
    const schedule = await prisma.schedule.create({
      data: {
        title,
        description,
        startTime,
        endTime,
        day,
        batchId: parseInt(batchId),
        meetingLink
      }
    });
    
    res.status(201).json({ success: true, data: schedule });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Update a schedule
router.put('/:id', async (req, res) => {
  try {
    const scheduleId = parseInt(req.params.id);
    const { 
      title,
      description,
      startTime,
      endTime,
      day,
      batchId,
      meetingLink
    } = req.body;
    
    const schedule = await prisma.schedule.update({
      where: { scheduleId },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(startTime !== undefined && { startTime }),
        ...(endTime !== undefined && { endTime }),
        ...(day !== undefined && { day }),
        ...(batchId !== undefined && { batchId: parseInt(batchId) }),
        ...(meetingLink !== undefined && { meetingLink })
      }
    });
    
    res.json({ success: true, data: schedule });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Delete a schedule
router.delete('/:id', async (req, res) => {
  try {
    const scheduleId = parseInt(req.params.id);
    
    await prisma.schedule.delete({
      where: { scheduleId }
    });
    
    res.json({ success: true });
  } catch (error) {
    handleApiError(res, error);
  }
});

export default router;
