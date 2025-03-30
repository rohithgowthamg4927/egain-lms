
import { User, Role, Course } from '@/lib/types';
import { apiFetch } from './core';

// User Management API
export const createUser = async (userData: Partial<User> & { password?: string }): Promise<{ success: boolean; data?: User; error?: string }> => {
  // Only send fields that exist in the Prisma schema
  const { fullName, email, role, password, phoneNumber, mustResetPassword } = userData;
  
  const sanitizedData = {
    fullName,
    email,
    role,
    password,
    phoneNumber: phoneNumber || null,
    mustResetPassword: mustResetPassword || true
  };
  
  return apiFetch<User>('/users', {
    method: 'POST',
    body: JSON.stringify(sanitizedData),
  });
};

export const updateUser = async (userId: number, userData: Partial<User> & { password?: string }): Promise<{ success: boolean; data?: User; error?: string }> => {
  // Only send fields that exist in the Prisma schema
  const { fullName, email, role, password, phoneNumber, mustResetPassword } = userData;
  
  const sanitizedData = {
    ...(fullName !== undefined && { fullName }),
    ...(email !== undefined && { email }),
    ...(role !== undefined && { role }),
    ...(password !== undefined && { password }),
    ...(phoneNumber !== undefined && { phoneNumber }),
    ...(mustResetPassword !== undefined && { mustResetPassword })
  };
  
  return apiFetch<User>(`/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(sanitizedData),
  });
};

// Get a specific user by ID
export const getUserById = async (userId: number): Promise<{ success: boolean; data?: { user: User; courses: Course[] }; error?: string }> => {
  console.log(`Calling getUserById API with userId: ${userId}`);
  return apiFetch<{ user: User; courses: Course[] }>(`/users/${userId}`);
};

// Users API
export const getUsers = async (role?: Role): Promise<{ success: boolean; data?: User[]; error?: string }> => {
  const endpoint = role ? `/users?role=${role}` : '/users';
  return apiFetch<User[]>(endpoint);
};

export const deleteUser = async (id: number): Promise<{ success: boolean; error?: string }> => {
  return apiFetch(`/users/${id}`, {
    method: 'DELETE',
  });
};
