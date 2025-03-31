
import { exec } from 'child_process';

console.log('🔄 Regenerating Prisma client to match current database schema...');

// Run prisma generate to update the client
exec('npx prisma generate', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Error regenerating Prisma client:', error.message);
    return;
  }
  
  if (stderr) {
    console.error('⚠️ Warnings:', stderr);
  }
  
  console.log('✅ Prisma client regenerated successfully!');
  console.log(stdout);
  
  console.log('\n🔍 You can now restart your application to use the updated client.');
});
