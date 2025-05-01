import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../utils/password.js';

const prisma = new PrismaClient();

async function hashAdminPassword() {
    try {
        // Find admin user
        const admin = await prisma.user.findFirst({
            where: {
                email: 'admin@lms.com',
                role: 'admin'
            }
        });

        if (!admin) {
            console.error('Admin user not found');
            process.exit(1);
        }

        // Hash the password
        const hashedPassword = await hashPassword('admin123');

        // Update admin password
        await prisma.user.update({
            where: { userId: admin.userId },
            data: { password: hashedPassword }
        });

        console.log('Admin password has been hashed successfully');
    } catch (error) {
        console.error('Error hashing admin password:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

hashAdminPassword(); 