
import { PrismaClient } from '@prisma/client';

// This is a special handling for browser environments
// In browsers, we'll use a mock implementation instead of the actual PrismaClient
const isBrowser = typeof window !== 'undefined';

// Define a type for our Prisma instance that can be either real or mock
type PrismaInstance = PrismaClient | any;

// Create either a real Prisma instance (for Node.js) or a mock (for browser)
const createPrismaInstance = (): PrismaInstance => {
  // For browser environments, return a mock implementation
  if (isBrowser) {
    console.warn('Prisma Client is being used in a browser environment. Using mock implementation.');
    // Return a mock object that mimics the PrismaClient interface
    // This is just to prevent runtime errors, actual data should be provided by API
    return getMockPrismaClient();
  }
  
  // For Node.js environments, use the real PrismaClient
  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
};

// Mock implementation of PrismaClient for browser environments
function getMockPrismaClient() {
  return {
    user: createMockModel('user'),
    courseCategory: createMockModel('courseCategory'),
    course: createMockModel('course'),
    batch: createMockModel('batch'),
    studentCourse: createMockModel('studentCourse'),
    studentBatch: createMockModel('studentBatch'),
    instructorCourse: createMockModel('instructorCourse'),
    schedule: createMockModel('schedule'),
    resource: createMockModel('resource'),
    courseReview: createMockModel('courseReview'),
    profilePicture: createMockModel('profilePicture'),
    $disconnect: async () => {}
  };
}

// Create a mock model with basic CRUD operations
function createMockModel(modelName: string) {
  return {
    findMany: async () => [],
    findUnique: async () => null,
    findFirst: async () => null,
    create: async (data: any) => ({ id: Date.now(), ...data.data }),
    update: async (data: any) => ({ id: data.where.id || 1, ...data.data }),
    delete: async () => ({}),
    deleteMany: async () => ({ count: 0 }),
    count: async () => 0,
    upsert: async (data: any) => ({ id: 1, ...data.create })
  };
}

// Create and export the prisma instance
export const prisma = globalThis.prisma || createPrismaInstance();

// Add to globalThis in development to prevent multiple instances
if (process.env.NODE_ENV !== 'production' && !isBrowser) {
  globalThis.prisma = prisma;
}

export default prisma;
