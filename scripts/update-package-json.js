
/**
 * This script updates package.json to include Prisma seed configuration
 */
const fs = require('fs');
const path = require('path');

console.log('📝 Updating package.json with Prisma seed configuration...');

try {
  // Read current package.json
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Add or update the prisma section
  packageJson.prisma = {
    seed: "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  };
  
  // Write updated package.json
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  
  console.log('✅ package.json updated successfully!');
} catch (error) {
  console.error('❌ Error updating package.json:', error.message);
  process.exit(1);
}
