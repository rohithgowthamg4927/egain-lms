import express from 'express';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

app.post('/api/setup-database', async (req, res) => {
  try {
    // Example database setup logic
    await prisma.user.create({ data: { name: 'Admin' } });
    res.status(200).send('Database setup completed');
  } catch (error) {
    console.error('Error setting up database:', error);
    res.status(500).send('Error setting up database');
  }
});

app.listen(3000, () => {
  console.log('Backend API running on http://localhost:3000');
});
