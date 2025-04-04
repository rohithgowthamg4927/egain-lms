import express from 'express';
import { PrismaClient } from '@prisma/client';
import { handleApiError } from '../utils/errorHandler.js';

const router = express.Router();
const prisma = new PrismaClient();

// Convert UTC to IST
const convertToIST = (date) => {
  if (!date) return null;
  const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
  return new Date(date.getTime() + istOffset);
};

// Get all schedules
router.get('/', async (req, res) => {
  try {
    const { batchId, date } = req.query;
    
    let whereClause = {};
    
    if (batchId) {
      whereClause.batchId = parseInt(batchId);
    }
    
    if (date) {
      const startOfDayUTC = new Date(date);
      startOfDayUTC.setUTCHours(0, 0, 0, 0);
      
      const endOfDayUTC = new Date(date);
      endOfDayUTC.setUTCHours(23, 59, 59, 999);
      
      whereClause.startTime = {
        gte: startOfDayUTC,
        lte: endOfDayUTC
      };
    }
    
    const schedules = await prisma.Schedule.findMany({
      where: whereClause,
      include: {
        batch: {
          include: {
            course: true,
            instructor: true,
          },
        },
      },
      orderBy: { startTime: 'asc' }
    });

    // Convert times to IST before sending response
    const formattedSchedules = schedules.map(schedule => ({
      ...schedule,
      startTime: convertToIST(schedule.startTime),
      endTime: convertToIST(schedule.endTime)
    }));

    res.json({ success: true, data: formattedSchedules });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Get schedule by ID
router.get('/:id', async (req, res) => {
  try {
    const scheduleId = parseInt(req.params.id);
    
    const schedule = await prisma.Schedule.findUnique({
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
    
    // Convert times to IST before sending response
    schedule.startTime = convertToIST(schedule.startTime);
    schedule.endTime = convertToIST(schedule.endTime);

    res.json({ success: true, data: schedule });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Create a new schedule
// Create a new schedule
router.post('/', async (req, res) => {
  try {
    const { batchId, topic, startTime, endTime, meetingLink, platform } = req.body;

    console.log('Creating schedule with data:', { batchId, topic, startTime, endTime, meetingLink, platform });

    const batch = await prisma.Batch.findUnique({
      where: { batchId: parseInt(batchId) }
    });

    if (!batch) {
      return res.status(400).json({
        success: false,
        error: 'Batch not found'
      });
    }

    // Convert startTime and endTime to IST before saving
    const startTimeIST = convertToIST(new Date(startTime));
    const endTimeIST = convertToIST(new Date(endTime));

    const schedule = await prisma.Schedule.create({
      data: {
        batch: {
          connect: { batchId: parseInt(batchId) },
        },
        topic: topic || null,
        startTime: startTimeIST, // Save in IST
        endTime: endTimeIST,     // Save in IST
        meetingLink: meetingLink || null,
        platform: platform || null
      }
    });

    // Convert times to IST before sending response
    schedule.startTime = convertToIST(schedule.startTime);
    schedule.endTime = convertToIST(schedule.endTime);

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
    const { topic, platform, startTime, endTime, batchId, meetingLink } = req.body;

    const updateData = {};
    
    if (startTime !== undefined) updateData.startTime = new Date(startTime);
    if (endTime !== undefined) updateData.endTime = new Date(endTime);
    if (batchId !== undefined) updateData.batchId = parseInt(batchId);
    if (meetingLink !== undefined) updateData.meetingLink = meetingLink;
    if (topic !== undefined) updateData.topic = topic;
    if (platform !== undefined) updateData.platform = platform;

    const schedule = await prisma.Schedule.update({
      where: { scheduleId },
      data: updateData
    });

    // Convert times to IST before sending response
    schedule.startTime = convertToIST(schedule.startTime);
    schedule.endTime = convertToIST(schedule.endTime);

    res.json({ success: true, data: schedule });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Delete a schedule
router.delete('/:id', async (req, res) => {
  try {
    const scheduleId = parseInt(req.params.id);
    
    await prisma.Schedule.delete({
      where: { scheduleId }
    });
    
    res.json({ success: true });
  } catch (error) {
    handleApiError(res, error);
  }
});

export default router;
