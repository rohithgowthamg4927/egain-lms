
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
    console.error('Error fetching schedules:', error);
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
    console.error(`Error fetching schedule ${scheduleId}:`, error);
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
  meetingLink?: string | null;
  platform?: string | null;
  description?: string | null;
}

// Create a new schedule
export const createSchedule = async (data: ScheduleInput): Promise<{ success: boolean; data?: Schedule; error?: string }> => {
  try {
    console.log('Creating schedule with data:', data);
    const response = await apiFetch<Schedule>('/schedules', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response;
  } catch (error) {
    console.error('Error creating schedule:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create schedule',
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
    console.error(`Error updating schedule ${scheduleId}:`, error);
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
    console.error(`Error deleting schedule ${scheduleId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete schedule',
    };
  }
};
