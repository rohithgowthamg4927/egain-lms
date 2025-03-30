import express from 'express';
import cors from 'cors';
import apiRoutes from './routes';
import { handleApiError } from './utils/errorHandler';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(express.json());
app.use(cors());

// Use API routes
app.use('/api', apiRoutes);

// Error handling middleware
app.use((req, res) => {
  console.error(`Route not found: ${req.method} ${req.url}`);
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.url}`
  });
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend API running on http://localhost:${PORT}`);
  console.log(`API endpoint at http://localhost:${PORT}/api`);
});
