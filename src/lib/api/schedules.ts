
import { Schedule } from '@/lib/types';
import { apiFetch } from './core';

// Schedules API
export const getSchedules = async (batchId?: number): Promise<{ success: boolean; data?: Schedule[]; error?: string }> => {
  const endpoint = batchId ? `/schedules?batchId=${batchId}` : '/schedules';
  return apiFetch<Schedule[]>(endpoint);
};

export const createSchedule = async (scheduleData: Partial<Schedule>): Promise<{ success: boolean; data?: Schedule; error?: string }> => {
  return apiFetch<Schedule>('/schedules', {
    method: 'POST',
    body: JSON.stringify(scheduleData),
  });
};
