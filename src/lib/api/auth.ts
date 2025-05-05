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
    }
  }
  
  // Fall back to API call
  return apiFetch<User>('/users/current');
};

export const login = async (email: string, password: string, role: Role): Promise<{ success: boolean; data?: { user: User; token: string }; error?: string }> => {
  
  
  try {
    const healthCheck = await fetch(`https://api.e-gain.co.in/api/auth/health`);
    if (!healthCheck.ok) {
      return { success: false, error: "Backend server not responding" };
    }
  } catch (error) {
    return { success: false, error: "Cannot connect to backend server" };
  }
  
  const payload = { email, password, role };
  
  try {
    const response = await apiFetch<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    
    
    // If login was successful, store the auth data
    if (response.success && response.data) {
      localStorage.setItem('currentUser', JSON.stringify(response.data.user));
      localStorage.setItem('authToken', response.data.token);
    }
    
    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error during login"
    };
  }
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
