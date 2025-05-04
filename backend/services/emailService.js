import nodemailer from 'nodemailer';
import { generateCredentialsCSV } from '../utils/csvGenerator.js';

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: 'email-smtp.ap-south-1.amazonaws.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.SES_SMTP_USERNAME,
                pass: process.env.SES_SMTP_PASSWORD
            }
        });
    }

    async sendCredentialsEmail(userData, isNewUser = true) {
        console.log('Sending email with isNewUser:', isNewUser); // Debug log
        
        const csvContent = generateCredentialsCSV(userData);
        
        const subject = isNewUser 
            ? 'Welcome to LMS - Your Login Credentials'
            : 'LMS - Your Password Has Been Reset';

        const body = isNewUser
            ? `Dear ${userData.fullName},\n\nYour account has been created. Please find your login credentials attached. Make sure to reset your password after logging in.\n\nBest regards,\nLMS Team`
            : `Dear ${userData.fullName},\n\nYour password has been reset by the administrator. Please find your new login credentials attached. Make sure to change your password after logging in.\n\nBest regards,\nLMS Team`;

        const mailOptions = {
            from: 'noreply@rohithgowthamg.cloud',
            to: userData.email,
            subject: subject,
            text: body,
            attachments: [{
                filename: `credentials_${userData.email}.csv`,
                content: csvContent
            }]
        };

        try {
            await this.transporter.sendMail(mailOptions);
            return { success: true };
        } catch (error) {
            console.error('Email sending failed:', error);
            return { success: false, error: error.message };
        }
    }
}

const emailService = new EmailService();
export default emailService;
