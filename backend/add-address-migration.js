
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Check if address column exists
    const hasColumn = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'address'
    `;

    if (hasColumn.length === 0) {
      // Column doesn't exist, add it
      console.log('Adding address column to users table...');
      await prisma.$executeRaw`
        ALTER TABLE users 
        ADD COLUMN address TEXT DEFAULT NULL
      `;
      console.log('Column added successfully!');
    } else {
      console.log('address column already exists.');
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
