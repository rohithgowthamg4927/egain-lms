
import { apiFetch } from './core';
import { Schedule } from '@/lib/types';

export interface ScheduleQueryParams {
  batchId?: number;
  instructorId?: number;
  startDate?: string;
  endDate?: string;
  date?: string;
}

// Get schedules with optional filters
export const getAllSchedules = async (params?: ScheduleQueryParams): Promise<{ success: boolean; data?: Schedule[]; error?: string }> => {
  try {
    // Build query string from params
    const queryParams = new URLSearchParams();
    
    if (params?.batchId) {
      queryParams.append('batchId', params.batchId.toString());
    }
    
    if (params?.instructorId) {
      queryParams.append('instructorId', params.instructorId.toString());
    }
    
    if (params?.startDate) {
      queryParams.append('startDate', params.startDate);
    }
    
    if (params?.endDate) {
      queryParams.append('endDate', params.endDate);
    }

    if (params?.date) {
      queryParams.append('date', params.date);
    }
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/schedules?${queryString}` : '/schedules';
    
    const response = await apiFetch<Schedule[]>(endpoint);
    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch schedules',
    };
  }
};

// Get a single schedule by ID
export const getSchedule = async (scheduleId: number): Promise<{ success: boolean; data?: Schedule; error?: string }> => {
  try {
    const response = await apiFetch<Schedule>(`/schedules/${scheduleId}`);
    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch schedule',
    };
  }
};

// For backward compatibility: alias getAllSchedules as getSchedules
export const getSchedules = getAllSchedules;

export interface ScheduleInput {
  batchId: number;
  topic: string;
  startTime: string;
  endTime: string;
  scheduleDate: string;
  meetingLink?: string | null;
  platform?: string | null;
  description?: string | null;
}

// Create a new schedule
export const createSchedule = async (data: ScheduleInput): Promise<{ success: boolean; data?: Schedule; error?: string }> => {
  try {
     
    
    // Send the data directly to the API
    const response = await apiFetch<Schedule>('/schedules', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create schedule',
    };
  }
};

// Create multiple schedules (for batch creation)
export const createMultipleSchedules = async (data: ScheduleInput[]): Promise<{ success: boolean; data?: Schedule[]; error?: string }> => {
  try {
    const results = [];
    
    for (const schedule of data) {
      const response = await createSchedule(schedule);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to create one of the schedules');
      }
      
      if (response.data) {
        results.push(response.data);
      }
    }
    
    return {
      success: true,
      data: results
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create multiple schedules',
    };
  }
};

// Update a schedule
export const updateSchedule = async (scheduleId: number, data: Partial<ScheduleInput>): Promise<{ success: boolean; data?: Schedule; error?: string }> => {
  try {
    const response = await apiFetch<Schedule>(`/schedules/${scheduleId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update schedule',
    };
  }
};

// Delete a schedule
export const deleteSchedule = async (scheduleId: number): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await apiFetch(`/schedules/${scheduleId}`, {
      method: 'DELETE',
    });
    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete schedule',
    };
  }
};
