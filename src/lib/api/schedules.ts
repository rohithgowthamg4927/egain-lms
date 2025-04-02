
import { Schedule } from '@/lib/types';
import { apiFetch } from './core';

// Get schedules with optional filters
export const getSchedules = async (filters?: { batchId?: number }): Promise<{ success: boolean; data?: Schedule[]; error?: string }> => {
  let url = '/schedules';
  
  if (filters?.batchId) {
    url += `?batchId=${filters.batchId}`;
  }
  
  return apiFetch<Schedule[]>(url);
};

// Get a schedule by ID
export const getScheduleById = async (scheduleId: number): Promise<{ success: boolean; data?: Schedule; error?: string }> => {
  return apiFetch<Schedule>(`/schedules/${scheduleId}`);
};

// Create a new schedule
export const createSchedule = async (scheduleData: Partial<Schedule>): Promise<{ success: boolean; data?: Schedule; error?: string }> => {
  return apiFetch<Schedule>('/schedules', {
    method: 'POST',
    body: JSON.stringify(scheduleData),
  });
};

// Update a schedule
export const updateSchedule = async (scheduleId: number, scheduleData: Partial<Schedule>): Promise<{ success: boolean; data?: Schedule; error?: string }> => {
  return apiFetch<Schedule>(`/schedules/${scheduleId}`, {
    method: 'PUT',
    body: JSON.stringify(scheduleData),
  });
};

// Delete a schedule
export const deleteSchedule = async (scheduleId: number): Promise<{ success: boolean; error?: string }> => {
  return apiFetch(`/schedules/${scheduleId}`, {
    method: 'DELETE',
  });
};
