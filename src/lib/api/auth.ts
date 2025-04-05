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
  
  // First verify server is running
  try {
    const healthCheck = await fetch(`http://localhost:3001/api/auth/health`);
    if (!healthCheck.ok) {
      console.error("Server health check failed");
      return { success: false, error: "Backend server not responding" };
    }
  } catch (error) {
    console.error("Server health check error:", error);
    return { success: false, error: "Cannot connect to backend server" };
  }
  
  // Log the exact payload being sent
  const payload = { email, password, role };
  console.log("Sending login payload:", payload);
  
  try {
    const response = await apiFetch<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    
    console.log("Login API response:", response);
    
    // If login was successful, store the auth data
    if (response.success && response.data) {
      localStorage.setItem('currentUser', JSON.stringify(response.data.user));
      localStorage.setItem('authToken', response.data.token);
      console.log("Stored user data in localStorage:", response.data.user);
    }
    
    return response;
  } catch (error) {
    console.error("Login fetch error:", error);
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
