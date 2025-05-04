import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPasswords() {
    try {
        const users = await prisma.user.findMany();
        console.log(`Found ${users.length} users\n`);
        
        users.forEach(user => {
            const isHashed = user.password.startsWith('$2b$');
            console.log(`User: ${user.email}`);
            console.log(`Password format: ${isHashed ? 'Hashed' : 'Plaintext'}`);
            console.log(`Password: ${user.password}`);
            console.log('-------------------');
        });
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkPasswords(); 