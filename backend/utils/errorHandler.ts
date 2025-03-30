
import { Response } from 'express';

// Helper function to handle API errors
export const handleApiError = (res: Response, error: any) => {
  console.error('API Error:', error);
  res.status(500).json({ 
    success: false, 
    error: error instanceof Error ? error.message : 'An unexpected error occurred' 
  });
};
