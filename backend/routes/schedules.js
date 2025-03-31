
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
      topic,
      platform
    } = req.body;
    
    console.log('Creating schedule with data:', { 
      startTime, endTime, dayOfWeek, batchId, meetingLink, topic, platform 
    });

    // Create the schedule with all fields
    const schedule = await prisma.schedule.create({
      data: {
        startTime: new Date(`1970-01-01T${startTime}`),
        endTime: new Date(`1970-01-01T${endTime}`),
        dayOfWeek: parseInt(dayOfWeek),
        batchId: parseInt(batchId),
        meetingLink: meetingLink || null,
        topic: topic || null,
        platform: platform || null
      }
    });
    
    res.status(201).json({ success: true, data: schedule });
  } catch (error) {
    console.error('Error creating schedule:', error);
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
    
    // Build update data conditionally
    const updateData = {};
    
    if (startTime !== undefined) {
      updateData.startTime = new Date(`1970-01-01T${startTime}`);
    }
    
    if (endTime !== undefined) {
      updateData.endTime = new Date(`1970-01-01T${endTime}`);
    }
    
    if (dayOfWeek !== undefined) {
      updateData.dayOfWeek = parseInt(dayOfWeek);
    }
    
    if (batchId !== undefined) {
      updateData.batchId = parseInt(batchId);
    }
    
    if (meetingLink !== undefined) {
      updateData.meetingLink = meetingLink;
    }
    
    if (topic !== undefined) {
      updateData.topic = topic;
    }
    
    if (platform !== undefined) {
      updateData.platform = platform;
    }
    
    const schedule = await prisma.schedule.update({
      where: { scheduleId },
      data: updateData
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
