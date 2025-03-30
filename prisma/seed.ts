import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Define the enums directly to match the schema
enum Role {
  admin = 'admin',
  instructor = 'instructor',
  student = 'student'
}

enum Level {
  beginner = 'beginner',
  intermediate = 'intermediate',
  advanced = 'advanced'
}

async function main() {
  // Clean up existing data
  await prisma.courseReview.deleteMany({});
  await prisma.resource.deleteMany({});
  await prisma.schedule.deleteMany({});
  await prisma.studentBatch.deleteMany({});
  await prisma.studentCourse.deleteMany({});
  await prisma.instructorCourse.deleteMany({});
  await prisma.batch.deleteMany({});
  await prisma.course.deleteMany({});
  await prisma.profilePicture.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.courseCategory.deleteMany({});

  console.log('Database cleaned');

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      fullName: 'Admin',
      email: 'admin@lms.com',
      password: 'Admin@123', // In a real app, this would be hashed
      role: Role.admin,
      phoneNumber: '9663040591',
      mustResetPassword: false
    }
  });

  console.log('Admin user created');

  // Create course categories
  const categories = await Promise.all([
    prisma.courseCategory.create({
      data: { categoryName: 'AWS' }
    }),
    prisma.courseCategory.create({
      data: { categoryName: 'DevOps' }
    }),
    prisma.courseCategory.create({
      data: { categoryName: 'Azure' }
    })
  ]);

  console.log('Categories created');

  // Create instructors
  const instructors = await Promise.all([
    prisma.user.create({
      data: {
        fullName: 'Debajit Chandra',
        email: 'debajit@gmail.com',
        password: 'Debajit123',
        role: Role.instructor,
        phoneNumber: '+1987654321',
        mustResetPassword: true
      }
    }),
    prisma.user.create({
      data: {
        fullName: 'Rohith Gowtham G',
        email: 'rohithgowthamg4927@gmail.com',
        password: 'Password123',
        role: Role.instructor,
        phoneNumber: '+1122334455',
        mustResetPassword: true
      }
    })
  ]);

  console.log('Instructors created');

  // Create students
  const students = await Promise.all([
    prisma.user.create({
      data: {
        fullName: 'Michael Brown',
        email: 'michael.brown@example.com',
        password: 'Password123',
        role: Role.student,
        phoneNumber: '+1555666777',
        mustResetPassword: true
      }
    }),
    prisma.user.create({
      data: {
        fullName: 'Sarah Davis',
        email: 'sarah.davis@example.com',
        password: 'Password123',
        role: Role.student,
        phoneNumber: '+1444555666',
        mustResetPassword: true
      }
    }),
    prisma.user.create({
      data: {
        fullName: 'Robert Wilson',
        email: 'robert.wilson@example.com',
        password: 'Password123',
        role: Role.student,
        phoneNumber: '+1333444555',
        mustResetPassword: true
      }
    })
  ]);

  console.log('Students created');

  // Create courses
  const courses = await Promise.all([
    prisma.course.create({
      data: {
        courseName: 'Introduction to React',
        description: 'Learn the fundamentals of AWS.',
        courseLevel: Level.beginner,
        categoryId: categories[0].categoryId,
        duration: 40,
        isPublished: true
      }
    }),
    prisma.course.create({
      data: {
        courseName: 'Azure Certification Training',
        description: 'Prepare for the Azure certification exam with hands-on labs.',
        courseLevel: Level.beginner,
        categoryId: categories[1].categoryId,
        duration: 35,
        isPublished: true
      }
    }),
    prisma.course.create({
      data: {
        courseName: 'Advanced K8s concepts',
        description: 'Dive deep into advanced Kubernetes patterns and techniques.',
        courseLevel: Level.advanced,
        categoryId: categories[0].categoryId,
        duration: 50,
        isPublished: true
      }
    }),
    prisma.course.create({
      data: {
        courseName: 'Python for Cloud',
        description: 'Learn how to use Python for Cloud and automation.',
        courseLevel: Level.intermediate,
        categoryId: categories[2].categoryId,
        duration: 60,
        isPublished: true
      }
    })
  ]);

  console.log('Courses created');

  // Create batches
  const now = new Date();
  const batches = await Promise.all([
    prisma.batch.create({
      data: {
        batchName: 'AWS Weekday Batch',
        courseId: courses[0].courseId,
        instructorId: instructors[0].userId,
        startDate: new Date(now.getFullYear(), now.getMonth() + 1, 1),
        endDate: new Date(now.getFullYear(), now.getMonth() + 3, 1)
      }
    }),
    prisma.batch.create({
      data: {
        batchName: 'Azure Weekend Batch',
        courseId: courses[1].courseId,
        instructorId: instructors[1].userId,
        startDate: new Date(now.getFullYear(), now.getMonth() + 1, 5),
        endDate: new Date(now.getFullYear(), now.getMonth() + 3, 5)
      }
    }),
    prisma.batch.create({
      data: {
        batchName: 'Kubernetes Advanced Evening',
        courseId: courses[2].courseId,
        instructorId: instructors[0].userId,
        startDate: new Date(now.getFullYear(), now.getMonth() + 2, 10),
        endDate: new Date(now.getFullYear(), now.getMonth() + 4, 10)
      }
    })
  ]);

  console.log('Batches created');

  // Enroll students in courses and batches
  await Promise.all([
    // Student 1 enrollments
    prisma.studentCourse.create({
      data: {
        studentId: students[0].userId,
        courseId: courses[0].courseId
      }
    }),
    prisma.studentBatch.create({
      data: {
        studentId: students[0].userId,
        batchId: batches[0].batchId
      }
    }),
    
    // Student 2 enrollments
    prisma.studentCourse.create({
      data: {
        studentId: students[1].userId,
        courseId: courses[1].courseId
      }
    }),
    prisma.studentBatch.create({
      data: {
        studentId: students[1].userId,
        batchId: batches[1].batchId
      }
    }),
    
    // Student 3 enrollments
    prisma.studentCourse.create({
      data: {
        studentId: students[2].userId,
        courseId: courses[2].courseId
      }
    }),
    prisma.studentBatch.create({
      data: {
        studentId: students[2].userId,
        batchId: batches[2].batchId
      }
    })
  ]);

  console.log('Student enrollments created');

  // Assign instructors to courses
  await Promise.all([
    prisma.instructorCourse.create({
      data: {
        instructorId: instructors[0].userId,
        courseId: courses[0].courseId
      }
    }),
    prisma.instructorCourse.create({
      data: {
        instructorId: instructors[1].userId,
        courseId: courses[1].courseId
      }
    }),
    prisma.instructorCourse.create({
      data: {
        instructorId: instructors[0].userId,
        courseId: courses[2].courseId
      }
    })
  ]);

  console.log('Instructor assignments created');

  // Create schedules for batches
  await Promise.all([
    prisma.schedule.create({
      data: {
        batchId: batches[0].batchId,
        dayOfWeek: 1, // Monday
        startTime: new Date(0, 0, 0, 18, 0), // 6:00 PM
        endTime: new Date(0, 0, 0, 19, 30) // 7:30 PM
      }
    }),
    prisma.schedule.create({
      data: {
        batchId: batches[0].batchId,
        dayOfWeek: 3, // Wednesday
        startTime: new Date(0, 0, 0, 18, 0), // 6:00 PM
        endTime: new Date(0, 0, 0, 19, 30) // 7:30 PM
      }
    }),
    prisma.schedule.create({
      data: {
        batchId: batches[1].batchId,
        dayOfWeek: 6, // Saturday
        startTime: new Date(0, 0, 0, 10, 0), // 10:00 AM
        endTime: new Date(0, 0, 0, 12, 0) // 12:00 PM
      }
    })
  ]);

  console.log('Schedules created');

  // Add course reviews
  await Promise.all([
    prisma.courseReview.create({
      data: {
        courseId: courses[0].courseId,
        userId: students[0].userId,
        rating: 5,
        review: 'Excellent course, very helpful for beginners!'
      }
    }),
    prisma.courseReview.create({
      data: {
        courseId: courses[1].courseId,
        userId: students[1].userId,
        rating: 4,
        review: 'Good introduction to Flutter, would recommend.'
      }
    })
  ]);

  console.log('Course reviews created');

  // Add resources
  await Promise.all([
    prisma.resource.create({
      data: {
        courseId: courses[0].courseId,
        title: 'React Fundamentals Slides',
        type: 'document',
        url: 'https://example.com/resources/react-slides.pdf'
      }
    }),
    prisma.resource.create({
      data: {
        courseId: courses[0].courseId,
        title: 'React Hooks Demo Code',
        type: 'code',
        url: 'https://github.com/example/react-hooks-demo'
      }
    }),
    prisma.resource.create({
      data: {
        courseId: courses[1].courseId,
        title: 'Flutter Setup Guide',
        type: 'document',
        url: 'https://example.com/resources/flutter-setup.pdf'
      }
    })
  ]);

  console.log('Resources created');

  console.log('Database seeding completed successfully');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
