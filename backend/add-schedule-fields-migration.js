
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Check if topic column exists
    const hasTopicColumn = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'schedules' 
      AND column_name = 'topic'
    `;

    if (hasTopicColumn.length === 0) {
      // Column doesn't exist, add it
      console.log('Adding topic column to schedules table...');
      await prisma.$executeRaw`
        ALTER TABLE schedules 
        ADD COLUMN topic TEXT DEFAULT NULL
      `;
      console.log('topic column added successfully!');
    } else {
      console.log('topic column already exists.');
    }

    // Check if platform column exists
    const hasPlatformColumn = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'schedules' 
      AND column_name = 'platform'
    `;

    if (hasPlatformColumn.length === 0) {
      // Column doesn't exist, add it
      console.log('Adding platform column to schedules table...');
      await prisma.$executeRaw`
        ALTER TABLE schedules 
        ADD COLUMN platform TEXT DEFAULT NULL
      `;
      console.log('platform column added successfully!');
    } else {
      console.log('platform column already exists.');
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
