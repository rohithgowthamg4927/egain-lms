
import { PrismaClient } from '@prisma/client';
import { Role, Level } from '@/lib/types';

// This script will initialize the database with some sample data if it's empty
async function setupDatabase() {
  try {
    const prisma = new PrismaClient();
    
    console.log('Setting up database...');
    
    // Check if any users exist
    const userCount = await prisma.user.count();
    
    if (userCount === 0) {
      console.log('No users found, creating sample data...');
      
      // Create categories
      const webDevCategory = await prisma.courseCategory.create({
        data: {
          categoryName: 'Web Development'
        }
      });
      
      const mobileDevCategory = await prisma.courseCategory.create({
        data: {
          categoryName: 'Mobile Development'
        }
      });
      
      const dataScience = await prisma.courseCategory.create({
        data: {
          categoryName: 'Data Science'
        }
      });
      
      // Create admin user
      await prisma.user.create({
        data: {
          fullName: 'Admin User',
          email: 'admin@lms.com',
          password: 'Admin@123', // In a real app, this would be hashed
          role: Role.admin,
          mustResetPassword: false,
          profilePicture: {
            create: {
              fileName: 'admin.jpg',
              fileUrl: 'https://i.pravatar.cc/150?img=1',
              fileType: 'image/jpeg',
              fileSize: 10000
            }
          }
        }
      });
      
      console.log('Sample data created successfully!');
    } else {
      console.log('Database already has users, skipping sample data creation.');
    }
    
    console.log('Database setup complete!');
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error setting up database:', error);
    throw error; // Rethrow to show in console
  }
}

export default setupDatabase;
