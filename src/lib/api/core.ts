
import { Role } from '@/lib/types';

// Base API URL - Use environment variable with fallback to localhost
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Generic fetch wrapper with improved error handling
export async function apiFetch<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`Fetching from: ${url}`, options);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    // Check if response is OK before trying to parse JSON
    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        // JSON error response
        const errorData = await response.json();
        console.error(`API error: ${response.status} ${response.statusText}`, errorData);
        return { 
          success: false, 
          error: errorData.error || `API error: ${response.status} ${response.statusText}`
        };
      } else {
        // Non-JSON error response (like HTML)
        const errorText = await response.text();
        console.error(`API error: ${response.status} ${response.statusText}`, errorText);
        return {
          success: false,
          error: `API error: ${response.status} ${response.statusText}`
        };
      }
    }
    
    // Parse JSON response
    const data = await response.json();
    console.log(`Response from ${url}:`, data);
    
    return data;
  } catch (error) {
    console.error('API fetch error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch data from API' 
    };
  }
}
