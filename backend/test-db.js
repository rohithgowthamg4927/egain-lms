import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('Attempting to connect to database...');
    await prisma.$connect();
    console.log('Database connection successful');
    
    // Try a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('Query successful:', result);
    
    // Check if we can query the users table
    const userCount = await prisma.user.count();
    console.log('Number of users in database:', userCount);
    
  } catch (error) {
    console.error('Database connection/query failed:', error);
  } finally {
    await prisma.$disconnect();
    process.exit();
  }
}

testConnection(); 