
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
    
    // For debugging
    console.log('Creating schedule with data:', { 
      startTime, endTime, dayOfWeek, batchId, meetingLink, topic, platform 
    });

    // Build the schedule data object with only the core fields
    const scheduleData = {
      startTime: new Date(`1970-01-01T${startTime}`),
      endTime: new Date(`1970-01-01T${endTime}`),
      dayOfWeek: parseInt(dayOfWeek),
      batchId: parseInt(batchId),
      meetingLink
    };

    // Let's check if the database schema supports these fields using a raw query first
    const result = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'schedules' 
      AND column_name IN ('topic', 'platform')
    `;

    console.log('Database columns check result:', result);
    
    // If the columns exist in the database, add them to the create object
    const columnNames = result.map(row => row.column_name);
    
    if (columnNames.includes('topic') && topic) {
      // @ts-ignore - Add topic if the column exists
      scheduleData.topic = topic;
    }
    
    if (columnNames.includes('platform') && platform) {
      // @ts-ignore - Add platform if the column exists
      scheduleData.platform = platform;
    }

    console.log('Final schedule data being sent to Prisma:', scheduleData);
    
    const schedule = await prisma.schedule.create({
      data: scheduleData
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
    
    // Let's check if the database schema supports these fields using a raw query first
    const result = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'schedules' 
      AND column_name IN ('topic', 'platform')
    `;
    
    const columnNames = result.map(row => row.column_name);
    
    // Only include these fields if they exist in the schema and database
    if (columnNames.includes('topic') && topic !== undefined) {
      // @ts-ignore - Add topic if the column exists
      updateData.topic = topic;
    }
    
    if (columnNames.includes('platform') && platform !== undefined) {
      // @ts-ignore - Add platform if the column exists
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
