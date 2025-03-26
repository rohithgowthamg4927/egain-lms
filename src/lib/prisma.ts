
import { PrismaClient } from '@prisma/client';

// Determine if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Define a type for our Prisma instance that can be either real or mock
type PrismaInstance = PrismaClient | any;

// Create either a real Prisma instance (for Node.js) or a mock (for browser)
const createPrismaInstance = (): PrismaInstance => {
  // For browser environments, return a mock implementation
  if (isBrowser) {
    console.warn('Prisma Client is being used in a browser environment. Using mock implementation.');
    // Return a mock object that mimics the PrismaClient interface
    return getMockPrismaClient();
  }
  
  // For Node.js environments, use the real PrismaClient
  console.log('Creating real PrismaClient instance for Node.js environment');
  return new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
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

// For Node.js environments, create the real Prisma instance
// For browser environments, create the mock Prisma instance
let prisma: PrismaInstance;

if (!globalThis.prisma) {
  prisma = createPrismaInstance();
  
  // Only save to globalThis in Node.js environment
  if (!isBrowser) {
    globalThis.prisma = prisma;
  }
} else {
  prisma = globalThis.prisma;
}

export { prisma };
export default prisma;
