
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { handleApiError } from '../utils/errorHandler.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Middleware to authenticate all routes
router.use(authenticateToken);

// Get attendance for a schedule
router.get('/schedule/:scheduleId', async (req, res) => {
  try {
    const scheduleId = parseInt(req.params.scheduleId);
    const { role, userId } = req.user;
    
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
            },
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

    // Role-based access control
    if (role === 'student') {
      // Students can only see their own records
      const isStudentEnrolled = schedule.batch.students.some(s => s.studentId === userId);
      if (!isStudentEnrolled) {
        return res.status(403).json({
          success: false,
          error: 'You are not enrolled in this batch'
        });
      }
    } else if (role === 'instructor') {
      // Instructors can only see their batch records
      if (schedule.batch.instructorId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'You are not assigned to this batch'
        });
      }
    }
    // Admins can see all records

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

    // Filter based on role
    let responseData;
    if (role === 'student') {
      // For students, only return their own record
      const studentRecord = students.find(s => s.userId === userId);
      if (!studentRecord) {
        return res.status(404).json({
          success: false,
          error: 'Student record not found'
        });
      }
      
      const existingRecord = attendanceMap.get(userId);
      responseData = [{
        attendanceId: existingRecord?.attendanceId,
        userId: studentRecord.userId,
        user: studentRecord,
        status: existingRecord?.status || null,
        markedBy: existingRecord?.markedBy || null,
        markedByUser: existingRecord?.markedByUser || null
      }];
    } else {
      // For instructors and admins, return all student records
      responseData = students.map(student => {
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
      
      // Also include instructor record for this schedule
      if (schedule.batch.instructorId) {
        const instructorRecord = attendanceMap.get(schedule.batch.instructorId);
        if (instructorRecord || (role === 'admin' || userId === schedule.batch.instructorId)) {
          responseData.push({
            attendanceId: instructorRecord?.attendanceId,
            userId: schedule.batch.instructorId,
            user: schedule.batch.instructor,
            status: instructorRecord?.status || null,
            markedBy: instructorRecord?.markedBy || null,
            markedByUser: instructorRecord?.markedByUser || null,
            isInstructor: true
          });
        }
      }
    }

    res.json({ success: true, data: responseData });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Mark attendance
router.post('/', async (req, res) => {
  try {
    const { scheduleId, userId, status } = req.body;
    const instructorId = req.user.userId;
    const role = req.user.role;
    
    // Validate required fields
    if (!scheduleId || !userId || !status) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Only instructors and admins can mark attendance
    if (role !== 'admin' && role !== 'instructor') {
      return res.status(403).json({
        success: false,
        error: 'Only instructors and admins can mark attendance'
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
    if (role !== 'admin' && schedule.batch.instructorId !== instructorId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to mark attendance for this batch'
      });
    }

    // Check if user exists and is a student
    const targetUser = await prisma.User.findUnique({
      where: { userId },
      include: {
        studentBatches: {
          where: { batchId: schedule.batchId }
        }
      }
    });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if student is enrolled in the batch, unless it's the instructor
    if (targetUser.role === 'student' && targetUser.studentBatches.length === 0) {
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
          markedBy: instructorId,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        include: {
          user: true,
          markedByUser: true
        }
      });
    }

    // If marking student attendance and instructor is doing it, auto-mark instructor as present
    if (targetUser.role === 'student' && role === 'instructor') {
      // Auto-mark instructor as present if not already marked
      const instructorAttendance = await prisma.Attendance.findUnique({
        where: {
          scheduleId_userId: {
            scheduleId,
            userId: instructorId
          }
        }
      });

      if (!instructorAttendance) {
        await prisma.Attendance.create({
          data: {
            scheduleId,
            userId: instructorId,
            status: 'present',
            markedBy: instructorId,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
      }
    }

    res.json({ success: true, data: attendance });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Mark bulk attendance
router.post('/bulk', async (req, res) => {
  try {
    const { scheduleId, attendanceRecords } = req.body;
    const instructorId = req.user.userId;
    const role = req.user.role;
    
    // Validate required fields
    if (!scheduleId || !attendanceRecords || !Array.isArray(attendanceRecords) || attendanceRecords.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid required fields'
      });
    }

    // Only instructors and admins can mark attendance
    if (role !== 'admin' && role !== 'instructor') {
      return res.status(403).json({
        success: false,
        error: 'Only instructors and admins can mark attendance'
      });
    }

    // First get the schedule with batch info
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

    // Check if user is instructor for this batch or admin
    if (role !== 'admin' && schedule.batch.instructorId !== instructorId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to mark attendance for this batch'
      });
    }

    // Validate that all users in attendanceRecords are enrolled in the batch
    const enrolledStudentIds = schedule.batch.students.map(s => s.studentId);
    
    for (const record of attendanceRecords) {
      if (!enrolledStudentIds.includes(record.userId) && record.userId !== schedule.batch.instructorId) {
        return res.status(400).json({
          success: false,
          error: `User with ID ${record.userId} is not enrolled in this batch`
        });
      }
    }

    // Process each attendance record
    const results = [];
    for (const record of attendanceRecords) {
      const { userId, status } = record;
      
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
          }
        });
      } else {
        attendance = await prisma.Attendance.create({
          data: {
            scheduleId,
            userId,
            status,
            markedBy: instructorId,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
      }
      
      results.push(attendance);
    }

    // Auto-mark instructor as present if not already marked
    if (role === 'instructor') {
      const instructorAttendance = await prisma.Attendance.findUnique({
        where: {
          scheduleId_userId: {
            scheduleId,
            userId: instructorId
          }
        }
      });

      if (!instructorAttendance) {
        await prisma.Attendance.create({
          data: {
            scheduleId,
            userId: instructorId,
            status: 'present',
            markedBy: instructorId,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
      }
    }

    res.json({ success: true, data: results });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Update attendance record
router.put('/:attendanceId', async (req, res) => {
  try {
    const attendanceId = parseInt(req.params.attendanceId);
    const { status } = req.body;
    const userId = req.user.userId;
    const role = req.user.role;

    // Only instructors and admins can update attendance
    if (role !== 'admin' && role !== 'instructor') {
      return res.status(403).json({
        success: false,
        error: 'Only instructors and admins can update attendance'
      });
    }

    // Get the attendance record
    const existingAttendance = await prisma.Attendance.findUnique({
      where: { attendanceId },
      include: {
        schedule: {
          include: {
            batch: true
          }
        }
      }
    });

    if (!existingAttendance) {
      return res.status(404).json({
        success: false,
        error: 'Attendance record not found'
      });
    }

    // Check if user is instructor for this batch or admin
    if (role !== 'admin' && existingAttendance.schedule.batch.instructorId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update attendance for this batch'
      });
    }

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
    const role = req.user.role;
    const userId = req.user.userId;

    // Only admins and instructors can delete attendance records
    if (role !== 'admin' && role !== 'instructor') {
      return res.status(403).json({
        success: false,
        error: 'Only admins and instructors can delete attendance records'
      });
    }

    // Get the attendance record first to check permissions
    const attendanceRecord = await prisma.Attendance.findUnique({
      where: { attendanceId },
      include: {
        schedule: {
          include: {
            batch: true
          }
        }
      }
    });

    if (!attendanceRecord) {
      return res.status(404).json({
        success: false,
        error: 'Attendance record not found'
      });
    }

    // If instructor, check if they own the batch
    if (role === 'instructor' && attendanceRecord.schedule.batch.instructorId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You are not authorized to delete this attendance record'
      });
    }

    await prisma.Attendance.delete({
      where: { attendanceId }
    });

    res.json({ success: true });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Get student attendance analytics
router.get('/analytics/student/:userId', async (req, res) => {
  try {
    const targetUserId = parseInt(req.params.userId);
    const { role, userId } = req.user;
    
    // Only admins, instructors, or the student themselves can view analytics
    if (role === 'student' && userId !== targetUserId) {
      return res.status(403).json({
        success: false,
        error: 'You can only view your own attendance analytics'
      });
    }

    // Check if user exists and is a student
    const user = await prisma.User.findUnique({
      where: { userId: targetUserId },
      include: {
        studentBatches: {
          include: {
            batch: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (user.role !== 'student') {
      return res.status(400).json({
        success: false,
        error: 'User is not a student'
      });
    }

    // Get all batches for this student
    const batches = user.studentBatches.map(sb => sb.batch);
    
    // For each batch, calculate attendance statistics
    const batchAnalytics = [];
    let totalClasses = 0;
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalLate = 0;

    for (const batch of batches) {
      // Get all schedules for this batch
      const schedules = await prisma.Schedule.findMany({
        where: { batchId: batch.batchId }
      });
      
      // Get attendance records for this student across all these schedules
      const attendanceRecords = await prisma.Attendance.findMany({
        where: {
          userId: targetUserId,
          scheduleId: {
            in: schedules.map(s => s.scheduleId)
          }
        }
      });
      
      const batchTotalClasses = schedules.length;
      const batchPresent = attendanceRecords.filter(a => a.status === 'present').length;
      const batchAbsent = attendanceRecords.filter(a => a.status === 'absent').length;
      const batchLate = attendanceRecords.filter(a => a.status === 'late').length;
      
      totalClasses += batchTotalClasses;
      totalPresent += batchPresent;
      totalAbsent += batchAbsent;
      totalLate += batchLate;
      
      batchAnalytics.push({
        batchId: batch.batchId,
        batchName: batch.batchName,
        total: batchTotalClasses,
        present: batchPresent,
        absent: batchAbsent,
        late: batchLate,
        percentage: batchTotalClasses > 0 ? Math.round((batchPresent / batchTotalClasses) * 100) : 0
      });
    }
    
    const overallPercentage = totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 0;
    
    const analytics = {
      overall: {
        total: totalClasses,
        present: totalPresent,
        absent: totalAbsent,
        late: totalLate,
        percentage: overallPercentage
      },
      byBatch: batchAnalytics
    };
    
    res.json({ success: true, data: analytics });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Get batch attendance analytics
router.get('/analytics/batch/:batchId', async (req, res) => {
  try {
    const batchId = parseInt(req.params.batchId);
    const { role, userId } = req.user;
    
    // Get the batch
    const batch = await prisma.Batch.findUnique({
      where: { batchId },
      include: {
        students: {
          include: {
            student: true
          }
        }
      }
    });
    
    if (!batch) {
      return res.status(404).json({
        success: false,
        error: 'Batch not found'
      });
    }
    
    // Check role-based access
    if (role === 'instructor' && batch.instructorId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You are not assigned to this batch'
      });
    } else if (role === 'student') {
      // Students can only view analytics for batches they're enrolled in
      const isEnrolled = batch.students.some(s => s.studentId === userId);
      if (!isEnrolled) {
        return res.status(403).json({
          success: false,
          error: 'You are not enrolled in this batch'
        });
      }
    }
    
    // Get all schedules for this batch
    const schedules = await prisma.Schedule.findMany({
      where: { batchId }
    });
    
    // Get all students in this batch
    const students = batch.students.map(s => s.student);
    
    // For each student, calculate attendance statistics
    const studentAnalytics = [];
    
    for (const student of students) {
      // Get attendance records for this student across all schedules
      const attendanceRecords = await prisma.Attendance.findMany({
        where: {
          userId: student.userId,
          scheduleId: {
            in: schedules.map(s => s.scheduleId)
          }
        }
      });
      
      const present = attendanceRecords.filter(a => a.status === 'present').length;
      const absent = attendanceRecords.filter(a => a.status === 'absent').length;
      const late = attendanceRecords.filter(a => a.status === 'late').length;
      
      studentAnalytics.push({
        userId: student.userId,
        fullName: student.fullName,
        email: student.email,
        total: schedules.length,
        present,
        absent,
        late,
        percentage: schedules.length > 0 ? Math.round((present / schedules.length) * 100) : 0
      });
    }
    
    // Calculate overall batch statistics
    const totalStudents = students.length;
    const totalClasses = schedules.length;
    const totalPossibleAttendances = totalStudents * totalClasses;
    
    // Get all attendance records for this batch
    const allAttendanceRecords = await prisma.Attendance.findMany({
      where: {
        scheduleId: {
          in: schedules.map(s => s.scheduleId)
        },
        userId: {
          in: students.map(s => s.userId)
        }
      }
    });
    
    const totalPresent = allAttendanceRecords.filter(a => a.status === 'present').length;
    const totalAbsent = allAttendanceRecords.filter(a => a.status === 'absent').length;
    const totalLate = allAttendanceRecords.filter(a => a.status === 'late').length;
    
    const analytics = {
      batchId,
      batchName: batch.batchName,
      totalStudents,
      totalClasses,
      overall: {
        total: totalPossibleAttendances,
        present: totalPresent,
        absent: totalAbsent,
        late: totalLate,
        percentage: totalPossibleAttendances > 0 ? Math.round((totalPresent / totalPossibleAttendances) * 100) : 0
      },
      students: studentAnalytics
    };
    
    res.json({ success: true, data: analytics });
  } catch (error) {
    handleApiError(res, error);
  }
});

export default router;
