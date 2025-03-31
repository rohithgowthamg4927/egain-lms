
import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';

const execAsync = promisify(exec);
const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting database setup...');
  
  try {
    // Verify database connection
    console.log('📊 Checking database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Set up initial admin user
    console.log('👤 Setting up admin user...');
    const adminExists = await prisma.user.findFirst({ where: { role: 'admin' } });
    
    if (!adminExists) {
      await prisma.user.create({ 
        data: { 
          fullName: 'Admin User',
          email: 'admin@lms.com',
          role: 'admin',
          password: 'Admin@123',
          mustResetPassword: false
        } 
      });
      console.log('✅ Admin user created successfully');
    } else {
      console.log('ℹ️ Admin user already exists');
    }

    // Create instructor if needed
    const instructorExists = await prisma.user.findFirst({ where: { role: 'instructor' } });
    
    if (!instructorExists) {
      await prisma.user.create({ 
        data: { 
          fullName: 'Instructor User',
          email: 'instructor@lms.com',
          role: 'instructor',
          password: 'Instructor@123',
          mustResetPassword: false
        } 
      });
      console.log('✅ Instructor user created successfully');
    } else {
      console.log('ℹ️ Instructor user already exists');
    }

    // Create student if needed
    const studentExists = await prisma.user.findFirst({ where: { role: 'student' } });
    
    if (!studentExists) {
      await prisma.user.create({ 
        data: { 
          fullName: 'Student User',
          email: 'student@lms.com',
          role: 'student',
          password: 'Student@123',
          mustResetPassword: false
        } 
      });
      console.log('✅ Student user created successfully');
    } else {
      console.log('ℹ️ Student user already exists');
    }
    
    // Create a category if needed
    const categoryExists = await prisma.courseCategory.findFirst();
    
    if (!categoryExists) {
      await prisma.courseCategory.create({
        data: {
          categoryName: 'Web Development'
        }
      });
      console.log('✅ Initial category created successfully');
    } else {
      console.log('ℹ️ Categories already exist');
    }
    
    console.log('🎉 Database setup completed successfully');
    console.log('');
    console.log('📝 Login credentials:');
    console.log('Admin: admin@lms.com / Admin@123');
    console.log('Instructor: instructor@lms.com / Instructor@123');
    console.log('Student: student@lms.com / Student@123');
    console.log('');
    console.log('🚀 To start the server, run:');
    console.log('npx ts-node backend/server.js');
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    console.error('');
    console.error('🔍 Common issues:');
    console.error('1. PostgreSQL not running');
    console.error('2. Invalid DATABASE_URL in .env file');
    console.error('3. Database user does not have correct permissions');
    console.error('');
    console.error('Check your .env file and make sure it contains:');
    console.error('DATABASE_URL="postgresql://username:password@localhost:5432/dbname"');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
