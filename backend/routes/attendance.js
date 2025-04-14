import express from 'express';
import { PrismaClient } from '@prisma/client';
import { handleApiError } from '../utils/errorHandler.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get attendance for a schedule
router.get('/schedule/:scheduleId', async (req, res) => {
  try {
    const scheduleId = parseInt(req.params.scheduleId);
    
    // Get the schedule with its batch and students
    const schedule = await prisma.Schedule.findUnique({
      where: { scheduleId },
      include: {
        batch: {
          include: {
            students: {
              include: {
                student: true
              }
            }
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

    // Get existing attendance records
    const attendanceRecords = await prisma.Attendance.findMany({
      where: { scheduleId },
      include: {
        user: true,
        markedByUser: true
      }
    });

    // Create a map of existing attendance records
    const attendanceMap = new Map(
      attendanceRecords.map(record => [record.userId, record])
    );

    // Get all students in the batch
    const students = schedule.batch.students.map(sb => sb.student);

    // Create response with attendance status for each student
    const response = students.map(student => {
      const existingRecord = attendanceMap.get(student.userId);
      return {
        attendanceId: existingRecord?.attendanceId,
        userId: student.userId,
        user: student,
        status: existingRecord?.status || null,
        markedBy: existingRecord?.markedBy || null,
        markedByUser: existingRecord?.markedByUser || null
      };
    });

    res.json({ success: true, data: response });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Mark attendance
router.post('/', async (req, res) => {
  try {
    const { scheduleId, userId, status } = req.body;
    
    // Validate required fields
    if (!scheduleId || !userId || !status) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // First get the schedule with batch info
    const schedule = await prisma.Schedule.findUnique({
      where: { scheduleId },
      include: {
        batch: true
      }
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        error: 'Schedule not found'
      });
    }

    // Check if user is instructor for this batch or admin
    if (req.user.role !== 'admin' && schedule.batch.instructorId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to mark attendance for this batch'
      });
    }

    // Check if user exists and is a student
    const user = await prisma.User.findUnique({
      where: { userId },
      include: {
        studentBatches: {
          where: { batchId: schedule.batchId }
        }
      }
    });

    if (!user || user.role !== 'student') {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }

    // Check if student is enrolled in the batch
    if (user.studentBatches.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Student is not enrolled in this batch'
      });
    }

    const existingAttendance = await prisma.Attendance.findUnique({
      where: {
        scheduleId_userId: {
          scheduleId,
          userId
        }
      }
    });

    let attendance;
    if (existingAttendance) {
      attendance = await prisma.Attendance.update({
        where: {
          attendanceId: existingAttendance.attendanceId
        },
        data: {
          status,
          updatedAt: new Date()
        },
        include: {
          user: true,
          markedByUser: true
        }
      });
    } else {
      // Create new attendance
      attendance = await prisma.Attendance.create({
        data: {
          scheduleId,
          userId,
          status,
          markedBy: req.user.userId,  // Use actual instructor/admin ID
          createdAt: new Date(),
          updatedAt: new Date()
        },
        include: {
          user: true,
          markedByUser: true
        }
      });
    }

    res.json({ success: true, data: attendance });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Update attendance record
router.put('/:attendanceId', async (req, res) => {
  try {
    const attendanceId = parseInt(req.params.attendanceId);
    const { status } = req.body;

    const attendance = await prisma.Attendance.update({
      where: { attendanceId },
      data: {
        status,
        updatedAt: new Date()
      },
      include: {
        user: true,
        markedByUser: true
      }
    });

    res.json({ success: true, data: attendance });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Delete attendance record
router.delete('/:attendanceId', async (req, res) => {
  try {
    const attendanceId = parseInt(req.params.attendanceId);

    await prisma.Attendance.delete({
      where: { attendanceId }
    });

    res.json({ success: true });
  } catch (error) {
    handleApiError(res, error);
  }
});

export default router; 