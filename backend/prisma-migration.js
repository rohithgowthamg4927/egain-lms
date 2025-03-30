
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Check if meetingLink column exists
    const hasColumn = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'schedules' 
      AND column_name = 'meeting_link'
    `;

    if (hasColumn.length === 0) {
      // Column doesn't exist, add it
      console.log('Adding meeting_link column to schedules table...');
      await prisma.$executeRaw`
        ALTER TABLE schedules 
        ADD COLUMN meeting_link TEXT DEFAULT NULL
      `;
      console.log('Column added successfully!');
    } else {
      console.log('meeting_link column already exists.');
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
