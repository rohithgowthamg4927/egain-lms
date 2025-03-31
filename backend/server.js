
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import apiRoutes from './routes/index.js';

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(express.json());
app.use(cors({
  origin: '*', // In production, you should restrict this to your frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Database connection check
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$connect();
    res.status(200).json({ 
      status: 'ok',
      message: 'Database connection successful',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Could not connect to database',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

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
  console.log(`\n🚀 Backend API running on http://localhost:${PORT}`);
  console.log(`📚 API endpoint at http://localhost:${PORT}/api`);
  console.log(`❤️  Health check endpoint at http://localhost:${PORT}/api/health`);
  console.log(`\n💻 Run this in a new terminal to setup the database:`);
  console.log(`npx ts-node backend/setup-database.js\n`);
});
