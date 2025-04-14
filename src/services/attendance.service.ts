import { PrismaClient } from '@prisma/client';
import { apiFetch } from '@/lib/api/core';
import { Role } from '@/lib/types';

const prisma = new PrismaClient();

export class AttendanceService {
  // Check if instructor is assigned to the batch
  private async validateInstructorAccess(instructorId: number, batchId: number) {
    const response = await apiFetch<{ success: boolean }>(`/batches/${batchId}/validate-instructor/${instructorId}`);
    if (!response.success) {
      throw new Error('You are not authorized to access this batch');
    }
    return true;
  }

  // Mark attendance for a schedule
  async markAttendance(scheduleId: number, userId: number, status: string) {
    const response = await apiFetch<{ success: boolean; data?: any }>('/attendance', {
      method: 'POST',
      body: JSON.stringify({
        scheduleId,
        userId,
        status
      })
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to mark attendance');
    }

    return response.data;
  }

  // Get attendance for a schedule
  async getScheduleAttendance(scheduleId: number) {
    const response = await apiFetch<{ success: boolean; data?: any }>(`/attendance/schedule/${scheduleId}`);

    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch attendance');
    }

    return response;
  }

  // Update attendance record
  async updateAttendance(attendanceId: number, status: string) {
    const response = await apiFetch<{ success: boolean; data?: any }>(`/attendance/${attendanceId}`, {
      method: 'PUT',
      body: JSON.stringify({
        status
      })
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to update attendance');
    }

    return response.data;
  }

  // Delete attendance record
  async deleteAttendance(attendanceId: number) {
    const response = await apiFetch<{ success: boolean }>(`/attendance/${attendanceId}`, {
      method: 'DELETE'
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to delete attendance');
    }

    return { message: 'Attendance record deleted successfully' };
  }
} 