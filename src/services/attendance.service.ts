
import { apiFetch } from '@/lib/api/core';
import { Status, Role } from '@/lib/types';

interface AttendanceRecord {
  attendanceId: number;
  scheduleId: number;
  userId: number;
  status: Status;
  markedBy: number; 
  createdAt: string;
  updatedAt: string;
  user: {
    userId: number;
    fullName: string;
    email: string;
    role: Role;
  };
  schedule: {
    scheduleId: number;
    topic: string;
    scheduleDate: string;
    startTime: string;
    endTime: string;
    batch: {
      batchId: number;
      batchName: string;
      instructor: {
        userId: number;
        fullName: string;
      };
    };
  };
  markedByUser: {
    userId: number;
    fullName: string;
    role: Role;
  };
}

export interface AttendanceAnalytics {
  overall: {
    total: number;
    present: number;
    absent: number;
    late: number;
    percentage: number;
  };
  byBatch?: Array<{
    batchId: number;
    batchName: string;
    total: number;
    present: number;
    absent: number;
    late: number;
    percentage: number;
    scheduleDate?: string;
    startTime?: string;
    endTime?: string;
  }>;
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
  history?: Array<{
    attendanceId: number;
    scheduleId: number;
    userId: number;
    status: Status;
    markedAt: string;
    user: {
      userId: number;  
      fullName: string;
      email: string;
      role: Role;
    };
    schedule: {
      topic: string;
      scheduleDate: string;
      startTime: string;
      endTime: string;
      batch?: {      
        batchName: string;
        instructor?: {
          fullName: string;
        };
      };
    };
    markedByUser: {
      fullName: string;
      email: string;
      role: Role;
    };
  }>;
  totalClasses?: number;
  totalStudents?: number;
}

// Get student attendance analytics
export const getStudentAttendanceAnalytics = async (
  studentId: number
): Promise<AttendanceAnalytics> => {
  try {
    const response = await apiFetch<AttendanceAnalytics>(`/attendance/analytics/student/${studentId}`);
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch student attendance analytics');
    }
    
    // Ensure we have proper default values if data is incomplete
    return {
      overall: response.data?.overall || { total: 0, present: 0, absent: 0, late: 0, percentage: 0 },
      byBatch: response.data?.byBatch || [],
      totalClasses: response.data?.totalClasses || 0,
      totalStudents: response.data?.totalStudents || 0,
      students: response.data?.students || [],
      history: response.data?.history || []
    };
  } catch (error) {
    console.error('Error fetching student attendance analytics:', error);
    // Return empty default data in case of error
    return {
      overall: { total: 0, present: 0, absent: 0, late: 0, percentage: 0 },
      byBatch: [],
      totalClasses: 0,
      totalStudents: 0,
      students: [],
      history: []
    };
  }
};

// Get batch attendance analytics
export const getBatchAttendanceAnalytics = async (
  batchId: number
): Promise<AttendanceAnalytics> => {
  try {
    const response = await apiFetch<AttendanceAnalytics>(`/attendance/analytics/batch/${batchId}`);
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch batch attendance analytics');
    }
    
    // Ensure we have proper default values if data is incomplete
    return {
      overall: response.data?.overall || { total: 0, present: 0, absent: 0, late: 0, percentage: 0 },
      byBatch: response.data?.byBatch || [],
      totalClasses: response.data?.totalClasses || 0,
      totalStudents: response.data?.totalStudents || 0,
      students: response.data?.students || [],
      history: response.data?.history || []
    };
  } catch (error) {
    console.error('Error fetching batch attendance analytics:', error);
    // Return empty default data in case of error
    return {
      overall: { total: 0, present: 0, absent: 0, late: 0, percentage: 0 },
      byBatch: [],
      totalClasses: 0,
      totalStudents: 0,
      students: [],
      history: []
    };
  }
};

// Mark attendance for a student
export const markAttendance = async (
  scheduleId: number,
  userId: number,
  status: Status
): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await apiFetch(`/attendance/mark`, {
      method: 'POST',
      body: JSON.stringify({
        scheduleId,
        userId,
        status
      })
    });
    
    return response;
  } catch (error) {
    console.error('Error marking attendance:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to mark attendance'
    };
  }
};

// Mark attendance in bulk
export const markBulkAttendance = async (
  scheduleId: number,
  attendanceRecords: Array<{ userId: number; status: Status }>
): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await apiFetch(`/attendance/bulk`, {
      method: 'POST',
      body: JSON.stringify({
        scheduleId,
        attendanceRecords
      })
    });
    
    return response;
  } catch (error) {
    console.error('Error marking bulk attendance:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to mark bulk attendance'
    };
  }
};

// Get attendance records for a schedule
export const getScheduleAttendance = async (
  scheduleId: number
): Promise<{ success: boolean; data?: { records: AttendanceRecord[] }; error?: string }> => {
  try {
    const response = await apiFetch<{ records: AttendanceRecord[] }>(`/attendance/schedule/${scheduleId}`);
    return response;
  } catch (error) {
    console.error('Error fetching schedule attendance:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch schedule attendance'
    };
  }
};

// Delete attendance record
export const deleteAttendance = async (
  attendanceId: number
): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await apiFetch(`/attendance/${attendanceId}`, {
      method: 'DELETE'
    });
    
    return response;
  } catch (error) {
    console.error('Error deleting attendance:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete attendance'
    };
  }
};

// Get attendance history for a batch
export const getAttendanceHistory = async (
  batchId: number
): Promise<{ success: boolean; data?: AttendanceRecord[]; error?: string }> => {
  try {
    const response = await apiFetch<AttendanceRecord[]>(`/attendance/history/${batchId}`);
    return response;
  } catch (error) {
    console.error('Error fetching attendance history:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch attendance history'
    };
  }
};
