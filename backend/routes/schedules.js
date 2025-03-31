
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { handleApiError } from '../utils/errorHandler.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all schedules
router.get('/', async (req, res) => {
  try {
    const { batchId } = req.query;
    
    const whereClause = batchId ? { batchId: parseInt(batchId) } : {};
    
    const schedules = await prisma.schedule.findMany({
      where: whereClause,
      include: {
        batch: {
          include: {
            course: true,
            instructor: true
          }
        }
      },
      orderBy: { dayOfWeek: 'asc' }
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
      startTime,
      endTime,
      dayOfWeek,
      batchId,
      meetingLink,
      platform,
      topic
    } = req.body;
    
    const schedule = await prisma.schedule.create({
      data: {
        startTime: new Date(`1970-01-01T${startTime}`),
        endTime: new Date(`1970-01-01T${endTime}`),
        dayOfWeek: parseInt(dayOfWeek),
        batchId: parseInt(batchId),
        meetingLink,
        platform,
        topic
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
      topic,
      platform,
      startTime,
      endTime,
      dayOfWeek,
      batchId,
      meetingLink
    } = req.body;
    
    const schedule = await prisma.schedule.update({
      where: { scheduleId },
      data: {
        ...(topic !== undefined && { topic }),
        ...(platform !== undefined && { platform }),
        ...(startTime !== undefined && { startTime: new Date(`1970-01-01T${startTime}`) }),
        ...(endTime !== undefined && { endTime: new Date(`1970-01-01T${endTime}`) }),
        ...(dayOfWeek !== undefined && { dayOfWeek: parseInt(dayOfWeek) }),
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
