import express from 'express';
import { PrismaClient } from '@prisma/client';
import { handleApiError } from '../utils/errorHandler.js';

const router = express.Router();
const prisma = new PrismaClient();

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
      
      whereClause.scheduleDate = {
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
    
    res.json({ success: true, data: schedules });
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

    res.json({ success: true, data: schedule });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Create a new schedule
router.post('/', async (req, res) => {
  try {
    const { batchId, topic, startTime, endTime, meetingLink, platform, scheduleDate } = req.body;

    const batch = await prisma.Batch.findUnique({
      where: { batchId: parseInt(batchId) }
    });

    if (!batch) {
      return res.status(400).json({
        success: false,
        error: 'Batch not found'
      });
    }

    // Create a proper date object for scheduleDate
    const scheduleDay = new Date(scheduleDate);
    if (isNaN(scheduleDay.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format for scheduleDate'
      });
    }
    
    // Convert time strings (HH:MM) to full datetime objects
    let parsedStartTime, parsedEndTime;
    
    if (startTime && startTime.length <= 5) {
      // If it's just a time string like "09:00"
      const [startHours, startMinutes] = startTime.split(':').map(Number);
      parsedStartTime = new Date(scheduleDay);
      parsedStartTime.setHours(startHours, startMinutes, 0, 0);
    } else {
      parsedStartTime = new Date(startTime);
    }
    
    if (endTime && endTime.length <= 5) {
      // If it's just a time string like "10:00"
      const [endHours, endMinutes] = endTime.split(':').map(Number);
      parsedEndTime = new Date(scheduleDay);
      parsedEndTime.setHours(endHours, endMinutes, 0, 0);
    } else {
      parsedEndTime = new Date(endTime);
    }
    
    if (isNaN(parsedStartTime.getTime()) || isNaN(parsedEndTime.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format for startTime or endTime'
      });
    }

    const schedule = await prisma.Schedule.create({
      data: {
        batch: {
          connect: { batchId: parseInt(batchId) },
        },
        topic: topic || null,
        startTime: parsedStartTime,
        endTime: parsedEndTime,
        scheduleDate: scheduleDay,
        meetingLink: meetingLink || null,
        platform: platform || null
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
    const { topic, platform, startTime, endTime, batchId, meetingLink, description, scheduleDate } = req.body;

    const updateData = {};
    
    if (topic !== undefined) updateData.topic = topic;
    if (platform !== undefined) updateData.platform = platform;
    if (meetingLink !== undefined) updateData.meetingLink = meetingLink;
    
    if (scheduleDate !== undefined) {
      const parsedScheduleDate = new Date(scheduleDate);
      if (isNaN(parsedScheduleDate.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid date format for scheduleDate'
        });
      }
      updateData.scheduleDate = parsedScheduleDate;
    }
    
    if (startTime !== undefined) {
      let parsedStartTime;
      if (startTime.length <= 5) {
        // If it's just a time string like "09:00"
        const [startHours, startMinutes] = startTime.split(':').map(Number);
        const scheduleDay = updateData.scheduleDate || (await prisma.Schedule.findUnique({
          where: { scheduleId }
        }))?.scheduleDate;
        
        parsedStartTime = new Date(scheduleDay);
        parsedStartTime.setHours(startHours, startMinutes, 0, 0);
      } else {
        parsedStartTime = new Date(startTime);
      }
      
      if (isNaN(parsedStartTime.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid date format for startTime'
        });
      }
      updateData.startTime = parsedStartTime;
    }
    
    if (endTime !== undefined) {
      let parsedEndTime;
      if (endTime.length <= 5) {
        // If it's just a time string like "10:00"
        const [endHours, endMinutes] = endTime.split(':').map(Number);
        const scheduleDay = updateData.scheduleDate || (await prisma.Schedule.findUnique({
          where: { scheduleId }
        }))?.scheduleDate;
        
        parsedEndTime = new Date(scheduleDay);
        parsedEndTime.setHours(endHours, endMinutes, 0, 0);
      } else {
        parsedEndTime = new Date(endTime);
      }
      
      if (isNaN(parsedEndTime.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid date format for endTime'
        });
      }
      updateData.endTime = parsedEndTime;
    }
    
    if (batchId !== undefined) updateData.batchId = parseInt(batchId);

    const schedule = await prisma.Schedule.update({
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
    
    // First delete all attendance records for this schedule
    await prisma.attendance.deleteMany({
      where: { scheduleId }
    });
    
    // Then delete the schedule
    await prisma.schedule.delete({
      where: { scheduleId }
    });
    
    res.json({ success: true });
  } catch (error) {
    handleApiError(res, error);
  }
});

export default router;
