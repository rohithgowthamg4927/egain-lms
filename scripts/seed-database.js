
import { exec } from 'child_process';
import path from 'path';

console.log('Starting database seeding process...');

// Command to run the Prisma seed script
const seedCommand = 'npx prisma db seed';

// Execute the command
exec(seedCommand, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error executing seed command: ${error.message}`);
    return;
  }
  
  if (stderr) {
    console.error(`Seed stderr: ${stderr}`);
  }
  
  console.log(`Seed output: ${stdout}`);
  console.log('Database seeding completed successfully!');
});
