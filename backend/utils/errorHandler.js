
export const handleApiError = (res, error) => {
  console.error('API Error:', error);
  
  res.status(500).json({
    success: false,
    error: error instanceof Error ? error.message : 'An unknown error occurred'
  });
};
