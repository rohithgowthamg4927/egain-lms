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
        const csvContent = generateCredentialsCSV(userData);
        
        const subject = isNewUser 
            ? 'Welcome to LMS - Your Login Credentials'
            : 'LMS - Your Password Has Been Reset';

        const body = isNewUser
            ? `Dear ${userData.fullName},\n\nYour account has been created. Please find your login credentials attached. Make sure to reset your password after logging in.\n\nYou can access the LMS at: https://lms.e-gain.co.in\n\nBest regards,\nLMS Team`
            : `Dear ${userData.fullName},\n\nYour password has been reset by the administrator. Please find your new login credentials attached. Make sure to change your password after logging in.\n\nYou can access the LMS at: https://lms.e-gain.co.in\n\nBest regards,\nLMS Team`;

        const htmlBody = `
            <!DOCTYPE html>
            <html>
              <body style="margin:0;padding:0;background:#f6f6f6;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f6;padding:40px 0;">
                  <tr>
                    <td align="center">
                      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.05);padding:40px;">
                        <tr>
                          <td align="center" style="padding-bottom:24px;">
                            <img src="https://lms.e-gain.co.in/egain-logo.jpeg" alt="eGain LMS" width="120" style="display:block;margin:0 auto 16px auto;border-radius:12px;" />
                            <h2 style="margin:0;font-family:sans-serif;color:#1a237e;">Welcome to <a href="https://e-gain.co.in">e-gain Technologies</a></h2>
                          </td>
                        </tr>
                        <tr>
                          <td style="font-family:sans-serif;color:#333;font-size:16px;line-height:1.6;">
                            <p>Dear <b>${userData.fullName}</b>,</p>
                            <p>
                              ${isNewUser
                                ? 'Your account has been created. Please find your login credentials attached.<br>Make sure to reset your password after logging in.'
                                : 'Your password has been reset by the administrator. Please find your new login credentials attached.<br>Make sure to change your password after logging in.'}
                            </p>
                            <p>
                              You can access the LMS at:<br>
                              <a href="https://lms.e-gain.co.in" style="color:#1a237e;text-decoration:none;font-weight:500;">https://lms.e-gain.co.in</a>
                            </p>
                            <p>Best regards,<br>e-gain Technologies</p>
                          </td>
                        </tr>
                        <tr>
                          <td align="center" style="padding-top:32px;">
                            <small style="color:#888;font-size:12px;">&copy; 2025 e-gain Technologies. All rights reserved.</small>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </body>
            </html>
        `;

        const mailOptions = {
            from: 'noreplylms@e-gain.co.in',
            to: userData.email,
            subject: subject,
            text: body,
            html: htmlBody,
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

    async sendEnrollmentEmail({ student, batch, course, instructor }) {
        const formatDate = (date) => {
            const d = new Date(date);
            const day = d.getDate();
            const month = d.toLocaleString('default', { month: 'long' });
            const year = d.getFullYear();
            const ordinal = (day) => {
                if (day > 3 && day < 21) return 'th';
                switch (day % 10) {
                    case 1: return 'st';
                    case 2: return 'nd';
                    case 3: return 'rd';
                    default: return 'th';
                }
            };
            return `${day}${ordinal(day)} ${month} ${year}`;
        };

        const subject = `Enrolled in ${batch.batchName} (${course.courseName})`;
        const body = `Dear ${student.fullName},\n\nYou have been enrolled in the batch "${batch.batchName}" for the course "${course.courseName}".\n\nBatch Duration:\nStart Date: ${formatDate(batch.startDate)}\nEnd Date: ${formatDate(batch.endDate)}\n\nYour instructor: ${instructor.fullName}\nEmail: ${instructor.email}\nPhone: ${instructor.phoneNumber || 'N/A'}\n\nYou can access the LMS at: https://lms.e-gain.co.in\n\nBest regards,\ne-gain Technologies`;
        const htmlBody = `
            <!DOCTYPE html>
            <html>
              <body style="margin:0;padding:0;background:#f6f6f6;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f6;padding:40px 0;">
                  <tr>
                    <td align="center">
                      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.05);padding:40px;">
                        <tr>
                          <td align="center" style="padding-bottom:24px;">
                            <img src="https://lms.e-gain.co.in/egain-logo.jpeg" alt="eGain LMS" width="120" style="display:block;margin:0 auto 16px auto;border-radius:12px;" />
                            <h2 style="margin:0;font-family:sans-serif;color:#1a237e;">Batch Enrollment Confirmation</h2>
                          </td>
                        </tr>
                        <tr>
                          <td style="font-family:sans-serif;color:#333;font-size:16px;line-height:1.6;">
                            <p>Dear <b>${student.fullName}</b>,</p>
                            <p>
                              You have been enrolled in the batch <b>${batch.batchName}</b> for the course <b>${course.courseName}</b>.<br>
                              <br>
                              <b>Batch Duration:</b><br>
                              Start Date: ${formatDate(batch.startDate)}<br>
                              End Date: ${formatDate(batch.endDate)}<br>
                              <br>
                              <b>Your Instructor:</b><br>
                              Name: ${instructor.fullName}<br>
                              Email: ${instructor.email}<br>
                              Phone: ${instructor.phoneNumber || 'N/A'}
                            </p>
                            <p>
                              You can access the LMS at:<br>
                              <a href="https://lms.e-gain.co.in" style="color:#1a237e;text-decoration:none;font-weight:500;">https://lms.e-gain.co.in</a>
                            </p>
                            <p>Best regards,<br>e-gain Technologies</p>
                          </td>
                        </tr>
                        <tr>
                          <td align="center" style="padding-top:32px;">
                            <small style="color:#888;font-size:12px;">&copy; 2025 e-gain Technologies. All rights reserved.</small>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </body>
            </html>
        `;
        const mailOptions = {
            from: 'noreplylms@e-gain.co.in',
            to: student.email,
            subject,
            text: body,
            html: htmlBody
        };
        try {
            await this.transporter.sendMail(mailOptions);
            return { success: true };
        } catch (error) {
            console.error('Email sending failed:', error);
            return { success: false, error: error.message };
        }
    }

    async sendInstructorAssignmentEmail({ instructor, batch, course }) {
        const formatDate = (date) => {
            const d = new Date(date);
            const day = d.getDate();
            const month = d.toLocaleString('default', { month: 'long' });
            const year = d.getFullYear();
            const ordinal = (day) => {
                if (day > 3 && day < 21) return 'th';
                switch (day % 10) {
                    case 1: return 'st';
                    case 2: return 'nd';
                    case 3: return 'rd';
                    default: return 'th';
                }
            };
            return `${day}${ordinal(day)} ${month} ${year}`;
        };

        const subject = `Assigned to ${batch.batchName} (${course.courseName})`;
        const body = `Dear ${instructor.fullName},\n\nYou have been assigned as the instructor for the batch "${batch.batchName}" for the course "${course.courseName}".\n\nBatch Duration:\nStart Date: ${formatDate(batch.startDate)}\nEnd Date: ${formatDate(batch.endDate)}\n\nYou can access the LMS at: https://lms.e-gain.co.in\n\nBest regards,\ne-gain Technologies`;
        const htmlBody = `
            <!DOCTYPE html>
            <html>
              <body style="margin:0;padding:0;background:#f6f6f6;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f6;padding:40px 0;">
                  <tr>
                    <td align="center">
                      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.05);padding:40px;">
                        <tr>
                          <td align="center" style="padding-bottom:24px;">
                            <img src="https://lms.e-gain.co.in/egain-logo.jpeg" alt="eGain LMS" width="120" style="display:block;margin:0 auto 16px auto;border-radius:12px;" />
                            <h2 style="margin:0;font-family:sans-serif;color:#1a237e;">Batch Assignment Confirmation</h2>
                          </td>
                        </tr>
                        <tr>
                          <td style="font-family:sans-serif;color:#333;font-size:16px;line-height:1.6;">
                            <p>Dear <b>${instructor.fullName}</b>,</p>
                            <p>
                              You have been assigned as the instructor for the batch <b>${batch.batchName}</b> for the course <b>${course.courseName}</b>.<br>
                              <br>
                              <b>Batch Duration:</b><br>
                              Start Date: ${formatDate(batch.startDate)}<br>
                              End Date: ${formatDate(batch.endDate)}
                            </p>
                            <p>
                              You can access the LMS at:<br>
                              <a href="https://lms.e-gain.co.in" style="color:#1a237e;text-decoration:none;font-weight:500;">https://lms.e-gain.co.in</a>
                            </p>
                            <p>Best regards,<br>e-gain Technologies</p>
                          </td>
                        </tr>
                        <tr>
                          <td align="center" style="padding-top:32px;">
                            <small style="color:#888;font-size:12px;">&copy; 2025 e-gain Technologies. All rights reserved.</small>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </body>
            </html>
        `;
        const mailOptions = {
            from: 'noreplylms@e-gain.co.in',
            to: instructor.email,
            subject,
            text: body,
            html: htmlBody
        };
        try {
            await this.transporter.sendMail(mailOptions);
            return { success: true };
        } catch (error) {
            console.error('Email sending failed:', error);
            return { success: false, error: error.message };
        }
    }

    async sendEmailChangeNotification({ fullName, newEmail }) {
        const subject = 'Your email address has been updated';
        const body = `Dear ${fullName},\n\nYour email address for e-gain LMS has been changed to: ${newEmail}\n\nIf you did not request this change, please contact support immediately.\n\nBest regards,\ne-gain Technologies`;
        const htmlBody = `
            <!DOCTYPE html>
            <html>
              <body style="margin:0;padding:0;background:#f6f6f6;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f6;padding:40px 0;">
                  <tr>
                    <td align="center">
                      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.05);padding:40px;">
                        <tr>
                          <td align="center" style="padding-bottom:24px;">
                            <img src="https://lms.e-gain.co.in/egain-logo.jpeg" alt="eGain LMS" width="120" style="display:block;margin:0 auto 16px auto;border-radius:12px;" />
                            <h2 style="margin:0;font-family:sans-serif;color:#1a237e;">Email Address Updated</h2>
                          </td>
                        </tr>
                        <tr>
                          <td style="font-family:sans-serif;color:#333;font-size:16px;line-height:1.6;">
                            <p>Dear <b>${fullName}</b>,</p>
                            <p>
                              Your email address for e-gain LMS has been changed to:<br>
                              <b>${newEmail}</b>
                            </p>
                            <p>If you did not request this change, please contact support immediately.</p>
                            <p>Best regards,<br>e-gain Technologies</p>
                          </td>
                        </tr>
                        <tr>
                          <td align="center" style="padding-top:32px;">
                            <small style="color:#888;font-size:12px;">&copy; 2025 e-gain Technologies. All rights reserved.</small>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </body>
            </html>
        `;
        const mailOptions = {
            from: 'noreplylms@e-gain.co.in',
            to: newEmail,
            subject,
            text: body,
            html: htmlBody
        };
        try {
            await this.transporter.sendMail(mailOptions);
            return { success: true };
        } catch (error) {
            console.error('Email sending failed:', error);
            return { success: false, error: error.message };
        }
    }

    async sendClassScheduleEmail({ student, schedule, batch, course, instructor }) {
        const formatDate = (date) => {
            const d = new Date(date);
            const day = d.getDate();
            const month = d.toLocaleString('default', { month: 'long' });
            const year = d.getFullYear();
            const ordinal = (day) => {
                if (day > 3 && day < 21) return 'th';
                switch (day % 10) {
                    case 1: return 'st';
                    case 2: return 'nd';
                    case 3: return 'rd';
                    default: return 'th';
                }
            };
            return `${day}${ordinal(day)} ${month} ${year}`;
        };

        const formatTime = (timeString) => {
            if (!timeString) return '';
            try {
                // Handle both Date objects and time strings
                const date = timeString instanceof Date ? timeString : new Date(timeString);
                if (isNaN(date.getTime())) {
                    // If it's a time string in HH:MM format
                    const [hours, minutes] = timeString.split(':').map(Number);
                    const newDate = new Date();
                    newDate.setHours(hours, minutes);
                    return newDate.toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit', 
                        hour12: true 
                    });
                }
                return date.toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit', 
                    hour12: true 
                });
            } catch (error) {
                console.error('Error formatting time:', error);
                return timeString;
            }
        };

        const subject = `New Class Scheduled: ${schedule.topic || 'Class Session'} - ${batch.batchName}`;
        const body = `Dear ${student.fullName},\n\nA new class has been scheduled for your batch "${batch.batchName}" (${course.courseName}).\n\nClass Details:\nTopic: ${schedule.topic || 'Class Session'}\nDate: ${formatDate(schedule.scheduleDate)}\nTime: ${formatTime(schedule.startTime)} - ${formatTime(schedule.endTime)}\n\nInstructor: ${instructor.fullName}\n${schedule.meetingLink ? `Meeting Link: ${schedule.meetingLink}` : ''}\n\nYou can access the LMS at: https://lms.e-gain.co.in\n\nBest regards,\ne-gain Technologies`;

        const htmlBody = `
            <!DOCTYPE html>
            <html>
              <body style="margin:0;padding:0;background:#f6f6f6;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f6;padding:40px 0;">
                  <tr>
                    <td align="center">
                      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.05);padding:40px;">
                        <tr>
                          <td align="center" style="padding-bottom:24px;">
                            <img src="https://lms.e-gain.co.in/egain-logo.jpeg" alt="eGain LMS" width="120" style="display:block;margin:0 auto 16px auto;border-radius:12px;" />
                            <h2 style="margin:0;font-family:sans-serif;color:#1a237e;">New Class Scheduled</h2>
                          </td>
                        </tr>
                        <tr>
                          <td style="font-family:sans-serif;color:#333;font-size:16px;line-height:1.6;">
                            <p>Dear <b>${student.fullName}</b>,</p>
                            <p>
                              A new class has been scheduled for your batch <b>${batch.batchName}</b> (${course.courseName}).<br>
                              <br>
                              <b>Class Details:</b><br>
                              Topic: ${schedule.topic || 'Class Session'}<br>
                              Date: ${formatDate(schedule.scheduleDate)}<br>
                              Time: ${formatTime(schedule.startTime)} - ${formatTime(schedule.endTime)}<br>
                              <br>
                              <b>Instructor:</b> ${instructor.fullName}<br>
                              ${schedule.meetingLink ? `<br><b>Meeting Link:</b><br><a href="${schedule.meetingLink}" style="color:#1a237e;text-decoration:none;">${schedule.meetingLink}</a>` : ''}
                            </p>
                            <p>
                              You can access the LMS at:<br>
                              <a href="https://lms.e-gain.co.in" style="color:#1a237e;text-decoration:none;font-weight:500;">https://lms.e-gain.co.in</a>
                            </p>
                            <p>Best regards,<br>e-gain Technologies</p>
                          </td>
                        </tr>
                        <tr>
                          <td align="center" style="padding-top:32px;">
                            <small style="color:#888;font-size:12px;">&copy; 2025 e-gain Technologies. All rights reserved.</small>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </body>
            </html>
        `;

        const mailOptions = {
            from: 'noreplylms@e-gain.co.in',
            to: student.email,
            subject,
            text: body,
            html: htmlBody
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
