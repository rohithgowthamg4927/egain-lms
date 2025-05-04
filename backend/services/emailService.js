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

        // Add a rate limiter to prevent too many emails
        this.rateLimiter = new Map();
        this.MAX_EMAILS_PER_HOUR = 50;

        // Add to email service
        this.metrics = {
            sent: 0,
            failed: 0,
            rateLimited: 0
        };

        // Add to email service
        this.templates = {
            welcome: (name) => `Welcome ${name}...`,
            reset: (name) => `Password reset for ${name}...`
        };
    }

    async sendCredentialsEmail(userData, isNewUser = true) {
        if (!userData || !userData.email || !userData.password || !userData.fullName) {
            return { success: false, error: 'Missing required user data' };
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userData.email)) {
            return { success: false, error: 'Invalid email format' };
        }
        
        // Check rate limit
        const now = Date.now();
        const hourAgo = now - 3600000; // 1 hour in milliseconds
        
        // Clean up old entries
        for (const [email, timestamps] of this.rateLimiter.entries()) {
            this.rateLimiter.set(email, timestamps.filter(time => time > hourAgo));
            if (this.rateLimiter.get(email).length === 0) {
                this.rateLimiter.delete(email);
            }
        }
        
        // Check if user has exceeded limit
        const userTimestamps = this.rateLimiter.get(userData.email) || [];
        if (userTimestamps.length >= this.MAX_EMAILS_PER_HOUR) {
            return { 
                success: false, 
                error: 'Too many emails sent. Please try again later.' 
            };
        }
        
        // Add current timestamp
        userTimestamps.push(now);
        this.rateLimiter.set(userData.email, userTimestamps);
        
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

        const MAX_RETRIES = 3;
        let retryCount = 0;
        while (retryCount < MAX_RETRIES) {
            try {
                await this.transporter.sendMail(mailOptions);
                console.log(`Email sent to ${userData.email} at ${new Date().toISOString()}`);
                return { success: true };
            } catch (error) {
                retryCount++;
                if (retryCount === MAX_RETRIES) {
                    console.error('Email sending failed after retries:', error);
                    return { success: false, error: error.message };
                }
                await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
            }
        }
    }
}

const emailService = new EmailService();
export default emailService;
