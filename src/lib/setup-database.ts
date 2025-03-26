
import { PrismaClient } from '@prisma/client';
import { Role, Level } from '@/lib/types';

// This script will initialize the database with some sample data if it's empty
async function setupDatabase() {
  const prisma = new PrismaClient();
  
  try {
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
          password: 'admin123', // In a real app, this would be hashed
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
      
      // Create instructor user
      const instructor = await prisma.user.create({
        data: {
          fullName: 'Jane Smith',
          email: 'jane.smith@example.com',
          password: 'password', // In a real app, this would be hashed
          role: Role.instructor,
          mustResetPassword: true,
          profilePicture: {
            create: {
              fileName: 'jane.jpg',
              fileUrl: 'https://i.pravatar.cc/150?img=2',
              fileType: 'image/jpeg',
              fileSize: 10000
            }
          }
        }
      });
      
      // Create student user
      const student = await prisma.user.create({
        data: {
          fullName: 'John Doe',
          email: 'john.doe@example.com',
          password: 'password', // In a real app, this would be hashed
          role: Role.student,
          mustResetPassword: true,
          profilePicture: {
            create: {
              fileName: 'john.jpg',
              fileUrl: 'https://i.pravatar.cc/150?img=3',
              fileType: 'image/jpeg',
              fileSize: 10000
            }
          }
        }
      });
      
      // Create courses
      const reactCourse = await prisma.course.create({
        data: {
          courseName: 'Introduction to React',
          description: 'Learn the basics of React, hooks, context API and build real-world applications',
          courseLevel: Level.beginner,
          categoryId: webDevCategory.categoryId,
          thumbnailUrl: 'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
          duration: 18,
          isPublished: true
        }
      });
      
      // Create batch
      await prisma.batch.create({
        data: {
          batchName: 'React - Morning Batch',
          courseId: reactCourse.courseId,
          instructorId: instructor.userId,
          startDate: new Date('2023-06-01'),
          endDate: new Date('2023-08-01')
        }
      });
      
      // Enroll student in course
      await prisma.studentCourse.create({
        data: {
          studentId: student.userId,
          courseId: reactCourse.courseId
        }
      });
      
      console.log('Sample data created successfully!');
    } else {
      console.log('Database already has users, skipping sample data creation.');
    }
    
    console.log('Database setup complete!');
  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
setupDatabase().catch(e => {
  console.error(e);
  process.exit(1);
});

export default setupDatabase;
