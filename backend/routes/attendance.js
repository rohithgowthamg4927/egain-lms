import express from 'express';
import { PrismaClient } from '@prisma/client';
import { handleApiError } from '../utils/errorHandler.js';
import jwt from 'jsonwebtoken';

const router = express.Router();
const prisma = new PrismaClient();

// Middleware to authenticate all routes
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
};

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get attendance for a schedule
router.get('/schedule/:scheduleId', async (req, res) => {
  try {
    const scheduleId = parseInt(req.params.scheduleId);
    const { role, userId } = req.user;
    
    // First get the schedule with batch info
    const schedule = await prisma.Schedule.findUnique({
      where: { scheduleId },
      include: {
        batch: {
          include: {
            instructor: {
              select: {
                userId: true,
                fullName: true,
                email: true,
                role: true
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

    // Get enrolled students with their user details
    const studentBatches = await prisma.StudentBatch.findMany({
      where: {
        batchId: schedule.batchId,
      },
      include: {
        student: {
          select: {
            userId: true,
            fullName: true,
            email: true,
            role: true
          }
      }
    }
    });

    // Get existing attendance records
    const attendanceRecords = await prisma.Attendance.findMany({
      where: { 
        scheduleId,
        OR: [
          { user: { role: 'student' } },
          { user: { role: 'instructor' } }
        ]
      },
      include: {
        user: {
          select: {
            userId: true,
            fullName: true,
            email: true,
            role: true
          }
        },
        markedByUser: {
          select: {
            userId: true,
            fullName: true,
            role: true
          }
        }
      }
    });

    // Map enrolled students to the expected format
    const enrolledStudents = studentBatches
      .filter(sb => sb.student.role === 'student')
      .map(sb => ({
        userId: sb.student.userId,
        fullName: sb.student.fullName,
        email: sb.student.email,
        role: 'student'
      }));

    // Add instructor to the list if they exist
    if (schedule.batch.instructor) {
      enrolledStudents.push({
        userId: schedule.batch.instructor.userId,
        fullName: schedule.batch.instructor.fullName,
        email: schedule.batch.instructor.email,
        role: 'instructor'
      });
    }

    // Filter based on role
    const filteredStudents = role === 'student' 
      ? enrolledStudents.filter(s => s.userId === userId)
      : enrolledStudents;

    const filteredRecords = role === 'student'
      ? attendanceRecords.filter(record => record.user.userId === userId)
      : attendanceRecords;

    // Format attendance records to match frontend expectations
    const formattedRecords = filteredRecords.map(record => ({
      attendanceId: record.attendanceId,
      userId: record.user.userId,
      status: record.status,
      markedAt: record.createdAt,
      role: record.user.role,
      markedBy: record.markedByUser ? {
        userId: record.markedByUser.userId,
        fullName: record.markedByUser.fullName,
        role: record.markedByUser.role
      } : null
    }));

    res.json({ 
      success: true, 
      data: {
        records: formattedRecords
      }
    });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Mark attendance
router.post('/mark', async (req, res) => {
  try {
    const { scheduleId, userId, status } = req.body;
    const markedById = req.user.userId;
    const role = req.user.role;
    
    // Validate required fields
    if (!scheduleId || !userId || !status) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Only instructors and admins can mark attendance
    if (role !== 'instructor' && role !== 'admin') {
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
    if (role === 'instructor' && schedule.batch.instructorId !== markedById) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to mark attendance for this batch'
      });
    }

    // Check if user exists
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

    // If marking instructor attendance, they can only be marked as present
    if (targetUser.role === 'instructor' && status !== 'present') {
      return res.status(400).json({
        success: false,
        error: 'Instructors can only be marked as present'
      });
    }

    // Check if student is enrolled in the batch
    if (targetUser.role === 'student' && targetUser.studentBatches.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Student is not enrolled in this batch'
      });
    }

    // Check if attendance already exists
    const existingAttendance = await prisma.Attendance.findFirst({
      where: {
          scheduleId,
          userId
      }
    });

    if (existingAttendance) {
      // Update existing attendance
      const updatedAttendance = await prisma.Attendance.update({
        where: { attendanceId: existingAttendance.attendanceId },
        data: {
          status,
          markedBy: markedById
        },
        include: {
          user: true,
          markedByUser: true
        }
      });

      return res.json({
        success: true,
        data: updatedAttendance
      });
    }

    // Create new attendance record
    const newAttendance = await prisma.Attendance.create({
        data: {
          scheduleId,
          userId,
          status,
        markedBy: markedById
        },
        include: {
          user: true,
          markedByUser: true
        }
      });

    res.json({
      success: true,
      data: newAttendance
    });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Bulk mark attendance
router.post('/bulk', async (req, res) => {
  try {
    const { scheduleId, attendanceRecords } = req.body;
    const instructorId = req.user.userId;
    const role = req.user.role;
    
    // Validate required fields
    if (!scheduleId || !attendanceRecords || !Array.isArray(attendanceRecords)) {
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

    // Process each attendance record
    const results = await Promise.all(
      attendanceRecords.map(async ({ userId, status }) => {
        try {
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
            return { userId, success: false, error: 'User not found' };
          }

          // Check if student is enrolled in the batch
          if (targetUser.role === 'student' && targetUser.studentBatches.length === 0) {
            return { userId, success: false, error: 'Student is not enrolled in this batch' };
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
      
          return {
            userId,
            success: true,
            data: {
              attendanceId: attendance.attendanceId,
              status: attendance.status,
              markedAt: attendance.createdAt
            }
          };
        } catch (error) {
          return { userId, success: false, error: error.message };
      }
      })
    );

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Update attendance
router.put('/:attendanceId', async (req, res) => {
  try {
    const attendanceId = parseInt(req.params.attendanceId);
    const { status } = req.body;
    const instructorId = req.user.userId;
    const role = req.user.role;

    // Validate required fields
    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Only instructors and admins can update attendance
    if (role !== 'admin' && role !== 'instructor') {
      return res.status(403).json({
        success: false,
        error: 'Only instructors and admins can update attendance'
      });
    }

    // Get the attendance record
    const attendance = await prisma.Attendance.findUnique({
      where: { attendanceId },
      include: {
        schedule: {
          include: {
            batch: true
          }
        }
      }
    });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        error: 'Attendance record not found'
      });
    }

    // Check if user is instructor for this batch or admin
    if (role !== 'admin' && attendance.schedule.batch.instructorId !== instructorId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update attendance for this batch'
      });
    }

    // Update the attendance
    const updatedAttendance = await prisma.Attendance.update({
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

    // Format the response to match frontend expectations
    const formattedAttendance = {
      attendanceId: updatedAttendance.attendanceId,
      userId: updatedAttendance.user.userId,
      status: updatedAttendance.status,
      markedAt: updatedAttendance.createdAt
    };

    res.json({
      success: true,
      data: formattedAttendance
    });
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

// Get attendance history for a batch
router.get('/history/:batchId', async (req, res) => {
  try {
    const batchId = parseInt(req.params.batchId);
    const { role, userId } = req.user;

    // Get all schedules for this batch
    const schedules = await prisma.Schedule.findMany({
      where: { batchId },
      select: { scheduleId: true }
    });

    const scheduleIds = schedules.map(s => s.scheduleId);

    // Base query conditions
    const whereConditions = {
      scheduleId: { in: scheduleIds }
    };

    // If user is a student, only show their own records
    if (role === 'student') {
      whereConditions.userId = userId;
    }

    // Get attendance records with all related information
    const attendanceRecords = await prisma.Attendance.findMany({
      where: whereConditions,
      include: {
        user: {
          select: {
            userId: true,
            fullName: true,
            email: true,
            role: true
          }
        },
        schedule: {
          select: {
            scheduleId: true,
            topic: true,
            scheduleDate: true,
            startTime: true,
            endTime: true,
            batch: {
              select: {
                batchId: true,
                batchName: true,
                instructor: {
                  select: {
                    userId: true,
                    fullName: true
                  }
                }
              }
            }
          }
        },
        markedByUser: {
          select: {
            userId: true,
            fullName: true,
            role: true
          }
        }
      },
      orderBy: {
        schedule: {
          scheduleDate: 'desc'
        }
      }
    });

    res.json({
      success: true,
      data: attendanceRecords
    });
  } catch (error) {
    handleApiError(res, error);
  }
});

export default router;
