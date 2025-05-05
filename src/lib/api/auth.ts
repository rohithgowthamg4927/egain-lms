import { User, Role } from '@/lib/types';
import { apiFetch } from './core';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
  details?: string;
}

export const getCurrentUser = async (): Promise<ApiResponse<User>> => {
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

export const login = async (email: string, password: string, role: Role): Promise<ApiResponse<{ user: User; token: string }>> => {
  console.log('Login attempt with:', { email, password, role });
  
  try {
    // Check if server is reachable
    try {
      const healthCheck = await fetch(`/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (!healthCheck.ok) {
        console.error('Health check failed:', healthCheck.status);
        return { 
          success: false, 
          error: "Backend server not responding",
          status: healthCheck.status
        };
      }
    } catch (error) {
      console.error('Health check error:', error);
      return { 
        success: false, 
        error: "Cannot connect to backend server",
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
    
    const payload = { email, password, role };
    console.log('Sending payload:', payload);
    
    try {
      const response = await apiFetch<{ user: User; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      
      console.log('Login response:', response);
      
      if (response.success && response.data) {
        localStorage.setItem('currentUser', JSON.stringify(response.data.user));
        localStorage.setItem('authToken', response.data.token);
      }
      
      return response;
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error during login",
        details: error instanceof Error ? error.stack : undefined
      };
    }
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error during login",
      details: error instanceof Error ? error.stack : undefined
    };
  }
};

export const logout = async (): Promise<ApiResponse<null>> => {
  localStorage.removeItem('currentUser');
  localStorage.removeItem('authToken');
  return { success: true };
};

export const changePassword = async (userId: number, newPassword: string): Promise<ApiResponse<null>> => {
  return apiFetch(`/users/${userId}/change-password`, {
    method: 'POST',
    body: JSON.stringify({ newPassword }),
  });
};
