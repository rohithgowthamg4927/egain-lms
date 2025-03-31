
import { Schedule } from '@/lib/types';
import { apiFetch } from './core';

// Get all schedules with optional filtering by batchId
export const getSchedules = async (batchId?: number): Promise<{ success: boolean; data?: Schedule[]; error?: string }> => {
  const endpoint = batchId ? `/schedules?batchId=${batchId}` : '/schedules';
  return apiFetch<Schedule[]>(endpoint);
};

// Get a specific schedule by ID
export const getScheduleById = async (scheduleId: number): Promise<{ success: boolean; data?: Schedule; error?: string }> => {
  return apiFetch<Schedule>(`/schedules/${scheduleId}`);
};

// Create a new schedule
export const createSchedule = async (scheduleData: Partial<Schedule>): Promise<{ success: boolean; data?: Schedule; error?: string }> => {
  return apiFetch<Schedule>('/schedules', {
    method: 'POST',
    body: JSON.stringify({
      batchId: scheduleData.batchId,
      dayOfWeek: scheduleData.dayOfWeek,
      startTime: scheduleData.startTime,
      endTime: scheduleData.endTime,
      topic: scheduleData.topic,
      platform: scheduleData.platform,
      meetingLink: scheduleData.meetingLink
    }),
  });
};

// Update an existing schedule
export const updateSchedule = async (scheduleId: number, scheduleData: Partial<Schedule>): Promise<{ success: boolean; data?: Schedule; error?: string }> => {
  return apiFetch<Schedule>(`/schedules/${scheduleId}`, {
    method: 'PUT',
    body: JSON.stringify({
      batchId: scheduleData.batchId,
      dayOfWeek: scheduleData.dayOfWeek,
      startTime: scheduleData.startTime,
      endTime: scheduleData.endTime,
      topic: scheduleData.topic,
      platform: scheduleData.platform,
      meetingLink: scheduleData.meetingLink
    }),
  });
};

// Delete a schedule
export const deleteSchedule = async (scheduleId: number): Promise<{ success: boolean; error?: string }> => {
  return apiFetch(`/schedules/${scheduleId}`, {
    method: 'DELETE',
  });
};
