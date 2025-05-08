
import { User, Role } from '@/lib/types';
import { apiFetch } from './core';

// Get all users or filter by role
export const getUsers = async (role?: Role, userId?: number): Promise<{ success: boolean; data?: User[] | User; error?: string }> => {
  try {
    const endpoint = userId ? `/users/${userId}` : role ? `/users?role=${role}` : '/users';
    const response = await apiFetch<User[] | User>(endpoint);
    
    // If fetching a single user, wrap the response in an array for consistency
    if (userId && response.success && response.data) {
      return {
        success: true,
        data: Array.isArray(response.data) ? response.data : [response.data]
      };
    }
    
    // Ensure we always return an array of users
    if (response.success && response.data) {
      return {
        success: true,
        data: Array.isArray(response.data) ? response.data : [response.data]
      };
    }
    
    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch users'
    };
  }
};

// Get a single user by ID - alias for compatibility
export const getUser = async (userId: number): Promise<{ success: boolean; data?: User; error?: string }> => {
  try {
    const response = await apiFetch<User>(`/users/${userId}`);
    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch user'
    };
  }
};

interface UserData {
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  bio?: string | null;
  address?: string | null;
  role?: Role;
  mustResetPassword?: boolean;
  shouldChangePassword?: boolean;
  password?: string;
}

// Create a new user
export const createUser = async (data: Partial<UserData>): Promise<{ success: boolean; data?: User; error?: string }> => {
  try {
    const userData: UserData = {
      fullName: data.fullName || '',
      email: data.email || '',
      phoneNumber: data.phoneNumber || null,
      bio: data.bio || null,
      address: data.address || null,
      role: data.role || Role.student,
      mustResetPassword: data.mustResetPassword,
      password: data.password
    };
    
    const response = await apiFetch<User>('/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create user'
    };
  }
};

// Update a user
export const updateUser = async (userId: number, data: Partial<UserData>): Promise<{ success: boolean; data?: User; error?: string }> => {
  try {
    const userData: Partial<UserData> = {
      ...(data.fullName !== undefined && { fullName: data.fullName }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.phoneNumber !== undefined && { phoneNumber: data.phoneNumber || null }),
      ...(data.bio !== undefined && { bio: data.bio || null }),
      ...(data.address !== undefined && { address: data.address || null }),
      ...(data.role !== undefined && { role: data.role }),
      ...(data.password !== undefined && { password: data.password }),
      ...(data.mustResetPassword !== undefined && { mustResetPassword: data.mustResetPassword })
    };
    
    const response = await apiFetch<User>(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update user'
    };
  }
};

// Delete a user
export const deleteUser = async (userId: number): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await apiFetch(`/users/${userId}`, {
      method: 'DELETE'
    });
    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete user'
    };
  }
};

// Regenerate user password
export const regenerateUserPassword = async (userId: number): Promise<{ success: boolean; data?: { password: string }; error?: string }> => {
  try {
    const response = await apiFetch<{ password: string }>(`/users/${userId}/regenerate-password`, {
      method: 'POST'
    });
    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to regenerate password'
    };
  }
};
