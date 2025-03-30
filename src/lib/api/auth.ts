
import { User, Role } from '@/lib/types';
import { apiFetch } from './core';

export const getCurrentUser = async (): Promise<{ success: boolean; data?: User; error?: string }> => {
  // Get the user from localStorage if available
  const userJson = localStorage.getItem('currentUser');
  if (userJson) {
    try {
      const user = JSON.parse(userJson);
      return { success: true, data: user };
    } catch (e) {
      console.error('Error parsing user from localStorage', e);
    }
  }
  
  // Fall back to API call
  return apiFetch<User>('/users/current');
};

export const login = async (email: string, password: string, role: Role): Promise<{ success: boolean; data?: { user: User; token: string }; error?: string }> => {
  console.log("Calling login API with:", { email, role });
  const response = await apiFetch<{ user: User; token: string }>('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password, role }),
  });
  
  if (response.success && response.data) {
    // Store the user in localStorage
    localStorage.setItem('currentUser', JSON.stringify(response.data.user));
    localStorage.setItem('authToken', response.data.token);
  }
  
  return response;
};

export const logout = async (): Promise<{ success: boolean }> => {
  localStorage.removeItem('currentUser');
  localStorage.removeItem('authToken');
  return { success: true };
};

export const changePassword = async (userId: number, newPassword: string): Promise<{ success: boolean; error?: string }> => {
  return apiFetch(`/users/${userId}/change-password`, {
    method: 'POST',
    body: JSON.stringify({ newPassword }),
  });
};
