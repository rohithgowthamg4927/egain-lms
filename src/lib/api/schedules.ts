
import { Schedule } from '@/lib/types';
import { apiFetch } from './core';

// Get all schedules with optional filtering
export const getAllSchedules = async (params?: { batchId?: string | number }): Promise<{ success: boolean; data?: Schedule[]; error?: string }> => {
  const queryParams = params?.batchId ? `?batchId=${params.batchId}` : '';
  return apiFetch<Schedule[]>(`/schedules${queryParams}`);
};

// Get a single schedule by ID
export const getSchedule = async (scheduleId: number): Promise<{ success: boolean; data?: Schedule; error?: string }> => {
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

// Get schedules for a specific batch
export const getBatchSchedules = async (batchId: number): Promise<{ success: boolean; data?: Schedule[]; error?: string }> => {
  return getAllSchedules({ batchId });
};

// Add the missing getSchedules function (as an alias of getAllSchedules for backward compatibility)
export const getSchedules = getAllSchedules;
