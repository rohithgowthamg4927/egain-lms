
// This file is meant to be imported only in Node.js environment
// It should never be directly imported in components that run in the browser

import { PrismaClient } from '@prisma/client';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Create a variable to store the prisma instance
let prisma: PrismaClient;

if (isBrowser) {
  // This code should never be executed in browser
  // The dynamic imports in api.ts should prevent this from happening
  console.error('Error: Attempted to import PrismaClient in browser environment');
  // @ts-ignore - create an empty object as fallback
  prisma = {};
} else {
  // In Node.js environments, create a real Prisma instance
  // PrismaClient is attached to the `global` object in development to prevent
  // exhausting your database connection limit
  const globalForPrisma = global as unknown as { prisma: PrismaClient };

  prisma = globalForPrisma.prisma || new PrismaClient();

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
  }
}

export { prisma };
export default prisma;
