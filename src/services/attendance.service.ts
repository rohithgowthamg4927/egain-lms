
import { apiFetch } from '@/lib/api/core';
import { Role, Status } from '@/lib/types';

export interface AttendanceRecord {
  attendanceId?: number;
  userId: number;
  user: {
    userId: number;
    fullName: string;
    email: string;
  };
  status: Status | null;
  markedBy?: number;
  markedByUser?: {
    userId: number;
    fullName: string;
  };
  isInstructor?: boolean;
}

export interface AttendanceAnalytics {
  overall: {
    total: number;
    present: number;
    absent: number;
    late: number;
    percentage: number;
  };
  byBatch: Array<{
    batchId: number;
    batchName: string;
    total: number;
    present: number;
    absent: number;
    late: number;
    percentage: number;
  }>;
  totalClasses?: number;
  totalStudents?: number;
  students?: Array<{
    userId: number;
    fullName: string;
    email: string;
    total: number;
    present: number;
    absent: number;
    late: number;
    percentage: number;
  }>;
}

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
  async markAttendance(scheduleId: number, userId: number, status: Status) {
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

  // Mark attendance for multiple students at once
  async markBulkAttendance(scheduleId: number, attendanceRecords: { userId: number; status: Status }[]) {
    const response = await apiFetch<{ success: boolean; data?: any }>('/attendance/bulk', {
      method: 'POST',
      body: JSON.stringify({
        scheduleId,
        attendanceRecords
      })
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to mark bulk attendance');
    }

    return response.data;
  }

  // Get attendance for a schedule
  async getScheduleAttendance(scheduleId: number): Promise<AttendanceRecord[]> {
    const response = await apiFetch<{ success: boolean; data?: AttendanceRecord[] }>(`/attendance/schedule/${scheduleId}`);

    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch attendance');
    }

    // Extract the data from the response and ensure it's an array
    return Array.isArray(response.data) ? response.data : [];
  }

  // Get attendance analytics for a student
  async getStudentAttendanceAnalytics(userId: number): Promise<AttendanceAnalytics> {
    const response = await apiFetch<{ success: boolean; data?: AttendanceAnalytics }>(`/attendance/analytics/student/${userId}`);

    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch attendance analytics');
    }

    // If no data or data doesn't match our expected structure, return a default structure
    if (!response.data || !response.data.overall || !response.data.byBatch) {
      return {
        overall: { total: 0, present: 0, absent: 0, late: 0, percentage: 0 },
        byBatch: []
      };
    }

    // Return the analytics data
    return response.data;
  }

  // Get attendance analytics for a batch
  async getBatchAttendanceAnalytics(batchId: number): Promise<AttendanceAnalytics> {
    const response = await apiFetch<{ success: boolean; data?: AttendanceAnalytics }>(`/attendance/analytics/batch/${batchId}`);

    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch batch attendance analytics');
    }

    // If no data or data doesn't match our expected structure, return a default structure
    if (!response.data || !response.data.overall || !response.data.byBatch) {
      return {
        overall: { total: 0, present: 0, absent: 0, late: 0, percentage: 0 },
        byBatch: [],
        totalClasses: 0,
        totalStudents: 0,
        students: []
      };
    }

    // Return the analytics data
    return response.data;
  }

  // Update attendance record
  async updateAttendance(attendanceId: number, status: Status) {
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
