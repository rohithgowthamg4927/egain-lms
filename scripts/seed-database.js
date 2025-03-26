
/**
 * This script runs the Prisma seed file to populate the database
 */
const { execSync } = require('child_process');
const path = require('path');

console.log('📊 Starting database seeding process...');

try {
  // Run Prisma seed command
  console.log('🔄 Running Prisma seed...');
  execSync('npx prisma db seed', { stdio: 'inherit' });
  
  console.log('✅ Database seeding completed successfully!');
} catch (error) {
  console.error('❌ Error seeding database:', error.message);
  process.exit(1);
}
