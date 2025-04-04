
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
      batchId,
      topic,
      startTime,
      endTime,
      meetingLink,
      platform,
      description
    } = req.body;
    
    console.log('Creating schedule with data:', { 
      batchId, topic, startTime, endTime, meetingLink, platform, description
    });

    // Calculate dayOfWeek based on the date (1 = Sunday, 7 = Saturday)
    const date = new Date(startTime);
    const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay(); // Convert 0 (Sunday) to 7
    
    // Create the schedule with all fields
    const schedule = await prisma.schedule.create({
      data: {
        batchId: parseInt(batchId),
        topic: topic || null,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        meetingLink: meetingLink || null,
        platform: platform || null,
        dayOfWeek: dayOfWeek
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
      batchId,
      meetingLink,
      description
    } = req.body;
    
    // Build update data conditionally
    const updateData = {};
    
    if (startTime !== undefined) {
      const date = new Date(startTime);
      updateData.startTime = date;
      // Update dayOfWeek based on the new date (1 = Sunday, 7 = Saturday)
      const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay(); // Convert 0 (Sunday) to 7
      updateData.dayOfWeek = dayOfWeek;
    }
    
    if (endTime !== undefined) {
      updateData.endTime = new Date(endTime);
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
    
    if (description !== undefined) {
      updateData.description = description;
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
