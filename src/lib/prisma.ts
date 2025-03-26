
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
    // Only set datasources if we have a DATABASE_URL
    ...(process.env.DATABASE_URL && {
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    }),
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
    $disconnect: async () => {
      console.log('Mock $disconnect called');
    }
  };
}

// Create a mock model with basic CRUD operations
function createMockModel(modelName: string) {
  return {
    findMany: async () => {
      console.log(`Mock findMany called for ${modelName}`);
      return [];
    },
    findUnique: async () => {
      console.log(`Mock findUnique called for ${modelName}`);
      return null;
    },
    findFirst: async () => {
      console.log(`Mock findFirst called for ${modelName}`);
      return null;
    },
    create: async (data: any) => {
      console.log(`Mock create called for ${modelName}`, data);
      return { id: Date.now(), ...data.data };
    },
    update: async (data: any) => {
      console.log(`Mock update called for ${modelName}`, data);
      return { id: data.where.id || 1, ...data.data };
    },
    delete: async () => {
      console.log(`Mock delete called for ${modelName}`);
      return {};
    },
    deleteMany: async () => {
      console.log(`Mock deleteMany called for ${modelName}`);
      return { count: 0 };
    },
    count: async () => {
      console.log(`Mock count called for ${modelName}`);
      return 0;
    },
    upsert: async (data: any) => {
      console.log(`Mock upsert called for ${modelName}`, data);
      return { id: 1, ...data.create };
    }
  };
}

// Create and export the prisma instance
export const prisma = globalThis.prisma || createPrismaInstance();

// Add to globalThis in development to prevent multiple instances
// Only in Node.js environment, not in browser
if (process.env.NODE_ENV !== 'production' && !isBrowser) {
  globalThis.prisma = prisma;
}

export default prisma;
