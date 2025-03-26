
import { PrismaClient } from '@prisma/client';

// Create a singleton instance of PrismaClient
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Initialize Prisma Client
const prisma = globalForPrisma.prisma || new PrismaClient();

// Only save to globalThis outside of production
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export { prisma };
export default prisma;
