
import { User, Role, Course } from '@/lib/types';
import { apiFetch } from './core';

// User Management API
export const createUser = async (userData: Partial<User> & { password?: string }): Promise<{ success: boolean; data?: User; error?: string }> => {
  // Include all fields that exist in the Prisma schema
  const { fullName, email, role, password, phoneNumber, address, mustResetPassword } = userData;
  
  const sanitizedData = {
    fullName,
    email,
    role,
    password,
    phoneNumber: phoneNumber || null,
    address: address || null,
    mustResetPassword: mustResetPassword || true
  };
  
  return apiFetch<User>('/users', {
    method: 'POST',
    body: JSON.stringify(sanitizedData),
  });
};

export const updateUser = async (userId: number, userData: Partial<User> & { password?: string }): Promise<{ success: boolean; data?: User; error?: string }> => {
  // Include all fields that exist in the Prisma schema
  const { fullName, email, role, password, phoneNumber, address, mustResetPassword } = userData;
  
  const sanitizedData = {
    ...(fullName !== undefined && { fullName }),
    ...(email !== undefined && { email }),
    ...(role !== undefined && { role }),
    ...(password !== undefined && { password }),
    ...(phoneNumber !== undefined && { phoneNumber }),
    ...(address !== undefined && { address }),
    ...(mustResetPassword !== undefined && { mustResetPassword })
  };
  
  return apiFetch<User>(`/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(sanitizedData),
  });
};

// Get a specific user by ID
export const getUserById = async (userId: number): Promise<{ success: boolean; data?: User; error?: string }> => {
  console.log(`Calling getUserById API with userId: ${userId}`);
  // Make sure we're using the right endpoint that matches the backend
  return apiFetch<User>(`/users/${userId}`);
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
