
// This file should not be imported directly in browser components
import { PrismaClient } from '@prisma/client';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Create a variable to store the prisma instance
let prisma: PrismaClient;

if (isBrowser) {
  // In browser environments, provide a dummy implementation
  // that logs warnings instead of trying to connect to the database
  // @ts-ignore - this is intentional for browser environments
  prisma = new Proxy({}, {
    get: (_, prop) => {
      console.warn(`Prisma cannot be used in browser environments. Attempted to access: ${String(prop)}`);
      return new Proxy({}, {
        get: () => {
          return () => Promise.resolve([]);
        }
      });
    }
  });
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
