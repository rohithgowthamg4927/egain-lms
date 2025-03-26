
import { PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
//
// Learn more:
// https://pris.ly/d/help/next-js-best-practices

declare global {
  // This is needed for the browser environment
  var prisma: PrismaClient | undefined;
}

export const prisma = 
  globalThis.prisma || 
  new PrismaClient({
    // Disable data proxy - prevent browser compatibility issues
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;

export default prisma;
