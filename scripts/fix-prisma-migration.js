
/**
 * This script helps fix Prisma migration issues with views
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name correctly in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔄 Starting Prisma migration fix process...');

try {
  // Connect to PostgreSQL and drop the views
  console.log('🗑️ Dropping the student_details and instructor_details views...');
  
  // Get database credentials from .env
  const envPath = path.join(__dirname, '..', '.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const dbUrlMatch = envContent.match(/DATABASE_URL="postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^"]+)"/);
  
  if (!dbUrlMatch) {
    throw new Error('Could not parse DATABASE_URL from .env file');
  }
  
  const [, user, password, host, port, database] = dbUrlMatch;
  
  // Create SQL file to drop views
  const sqlPath = path.join(__dirname, 'drop-views.sql');
  fs.writeFileSync(sqlPath, 'DROP VIEW IF EXISTS student_details;\nDROP VIEW IF EXISTS instructor_details;');
  
  // Execute SQL
  const psqlCommand = `PGPASSWORD=${password} psql -h ${host} -p ${port} -U ${user} -d ${database} -f ${sqlPath}`;
  execSync(psqlCommand, { stdio: 'inherit' });
  
  // Run prisma db push
  console.log('🔄 Running prisma db push...');
  execSync('npx prisma db push', { stdio: 'inherit' });
  
  // Clean up
  fs.unlinkSync(sqlPath);
  
  console.log('✅ Database schema updated successfully!');
  console.log('⚠️ Note: You may need to recreate the student_details and instructor_details views manually.');
} catch (error) {
  console.error('❌ Error during migration fix:', error.message);
  process.exit(1);
}
