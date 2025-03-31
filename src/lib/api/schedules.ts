
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
  // For debugging
  console.log('Creating schedule with data:', scheduleData);
  
  // Only send the fields that are defined in the database schema
  const payload = {
    batchId: scheduleData.batchId,
    dayOfWeek: scheduleData.dayOfWeek,
    startTime: scheduleData.startTime,
    endTime: scheduleData.endTime,
    meetingLink: scheduleData.meetingLink || null,
  };

  // Only add topic and platform if they were provided
  if (scheduleData.topic) {
    payload['topic'] = scheduleData.topic;
  }

  if (scheduleData.platform) {
    payload['platform'] = scheduleData.platform;
  }
  
  return apiFetch<Schedule>('/schedules', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

// Update an existing schedule
export const updateSchedule = async (scheduleId: number, scheduleData: Partial<Schedule>): Promise<{ success: boolean; data?: Schedule; error?: string }> => {
  const updateData: any = {};
  
  // Only include fields that are defined
  if (scheduleData.batchId !== undefined) updateData.batchId = scheduleData.batchId;
  if (scheduleData.dayOfWeek !== undefined) updateData.dayOfWeek = scheduleData.dayOfWeek;
  if (scheduleData.startTime !== undefined) updateData.startTime = scheduleData.startTime;
  if (scheduleData.endTime !== undefined) updateData.endTime = scheduleData.endTime;
  if (scheduleData.meetingLink !== undefined) updateData.meetingLink = scheduleData.meetingLink;
  if (scheduleData.topic !== undefined) updateData.topic = scheduleData.topic;
  if (scheduleData.platform !== undefined) updateData.platform = scheduleData.platform;
  
  return apiFetch<Schedule>(`/schedules/${scheduleId}`, {
    method: 'PUT',
    body: JSON.stringify(updateData),
  });
};

// Delete a schedule
export const deleteSchedule = async (scheduleId: number): Promise<{ success: boolean; error?: string }> => {
  return apiFetch(`/schedules/${scheduleId}`, {
    method: 'DELETE',
  });
};
