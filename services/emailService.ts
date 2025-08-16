import nodemailer from 'nodemailer';
import { config } from '../config/config';

// Email transporter configuration
const createTransporter = () => {
    return nodemailer.createTransport({
        host: config.email.host,
        port: config.email.port,
        secure: config.email.secure, // true for 465, false for other ports
        auth: {
            user: config.email.user,
            pass: config.email.password
        }
    });
};

// Email templates
const getEmailTemplate = (type: string, data: any) => {
    const baseUrl = config.frontendUrl;

    switch (type) {
        case 'welcome':
            return {
                subject: 'Welcome to GlaciX!',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #2563eb;">Welcome to GlaciX, ${data.firstName}!</h2>
                        <p>Thank you for joining GlaciX. We're excited to help keep your vehicle sparkling clean!</p>
                        <p>Your account has been created successfully. You can now:</p>
                        <ul>
                            <li>Book cleaning appointments</li>
                            <li>Manage your bookings</li>
                            <li>Track your loyalty points</li>
                        </ul>
                        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3>Your Account Details:</h3>
                            <p><strong>Email:</strong> ${data.email}</p>
                            <p><strong>Points Balance:</strong> ${data.points || 0} points</p>
                        </div>
                        <a href="${baseUrl}/login" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">
                            Login to Your Account
                        </a>
                        <p style="color: #666; font-size: 14px;">If you have any questions, feel free to contact our support team.</p>
                    </div>
                `
            };

        case 'appointmentConfirmation':
            return {
                subject: 'Appointment Confirmed - GlaciX',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #16a34a;">Appointment Confirmed!</h2>
                        <p>Hi ${data.firstName},</p>
                        <p>Your car cleaning appointment has been confirmed. Here are the details:</p>
                        
                        <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 20px; margin: 20px 0;">
                            <h3 style="margin: 0 0 15px 0;">Appointment Details</h3>
                            <p><strong>Service:</strong> ${data.serviceType.charAt(0).toUpperCase() + data.serviceType.slice(1)} Cleaning</p>
                            <p><strong>Date:</strong> ${new Date(data.appointmentDate).toLocaleDateString()}</p>
                            <p><strong>Time:</strong> ${data.timeSlot}</p>
                            <p><strong>Location:</strong> ${data.location}</p>
                            <p><strong>Price:</strong> $${data.price}</p>
                            ${data.notes ? `<p><strong>Notes:</strong> ${data.notes}</p>` : ''}
                        </div>
                        
                        <p><strong>What to expect:</strong></p>
                        <ul>
                            <li>Our team will arrive at the scheduled time</li>
                            <li>Please ensure your vehicle is accessible</li>
                            <li>Remove any personal items from the car</li>
                        </ul>
                        
                        <a href="${baseUrl}/appointments" style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">
                            View Appointment
                        </a>
                        
                        <p style="color: #666; font-size: 14px;">Need to reschedule? Contact us at least 24 hours before your appointment.</p>
                    </div>
                `
            };

        case 'appointmentCancellation':
            return {
                subject: 'Appointment Cancelled - GlaciX',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #dc2626;">Appointment Cancelled</h2>
                        <p>Hi ${data.firstName},</p>
                        <p>Your appointment scheduled for ${new Date(data.appointmentDate).toLocaleDateString()} at ${data.timeSlot} has been cancelled.</p>
                        
                        ${data.reason ? `
                        <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; margin: 20px 0;">
                            <p><strong>Reason:</strong> ${data.reason}</p>
                        </div>
                        ` : ''}
                        
                        ${data.refundAmount ? `
                        <p><strong>Refund:</strong> $${data.refundAmount} will be processed within 3-5 business days.</p>
                        ` : ''}
                        
                        <p>We apologize for any inconvenience. Feel free to book a new appointment at your convenience.</p>
                        
                        <a href="${baseUrl}/book" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">
                            Book New Appointment
                        </a>
                    </div>
                `
            };

        case 'appointmentReminder':
            return {
                subject: 'Appointment Reminder - Tomorrow at GlaciX',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #f59e0b;">Appointment Reminder</h2>
                        <p>Hi ${data.firstName},</p>
                        <p>This is a friendly reminder about your car cleaning appointment tomorrow:</p>
                        
                        <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0;">
                            <h3 style="margin: 0 0 15px 0;">Tomorrow's Appointment</h3>
                            <p><strong>Service:</strong> ${data.serviceType.charAt(0).toUpperCase() + data.serviceType.slice(1)} Cleaning</p>
                            <p><strong>Time:</strong> ${data.timeSlot}</p>
                            <p><strong>Location:</strong> ${data.location}</p>
                        </div>
                        
                        <p><strong>Preparation checklist:</strong></p>
                        <ul>
                            <li>✓ Remove personal items from your car</li>
                            <li>✓ Ensure vehicle is accessible</li>
                            <li>✓ Clear any parking restrictions</li>
                        </ul>
                        
                        <a href="${baseUrl}/appointments" style="background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">
                            View Details
                        </a>
                        
                        <p style="color: #666; font-size: 14px;">Need to cancel or reschedule? Please let us know as soon as possible.</p>
                    </div>
                `
            };

        case 'pointsUpdate':
            return {
                subject: 'Points Balance Updated - GlaciX',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #7c3aed;">Points Balance Updated!</h2>
                        <p>Hi ${data.firstName},</p>
                        <p>Your loyalty points balance has been updated.</p>
                        
                        <div style="background-color: #f5f3ff; border-left: 4px solid #7c3aed; padding: 20px; margin: 20px 0;">
                            <h3 style="margin: 0 0 15px 0;">Points Summary</h3>
                            <p><strong>Previous Balance:</strong> ${data.previousPoints} points</p>
                            <p><strong>Change:</strong> ${data.pointsChange > 0 ? '+' : ''}${data.pointsChange} points</p>
                            <p><strong>New Balance:</strong> ${data.newPoints} points</p>
                            ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ''}
                        </div>
                        
                        ${data.newPoints >= 1000 ? `
                        <div style="background-color: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0;">
                            <p style="margin: 0;"><strong>🎉 Great news!</strong> You have enough points for a free basic cleaning!</p>
                        </div>
                        ` : ''}
                        
                        <a href="${baseUrl}/rewards" style="background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">
                            View Rewards
                        </a>
                    </div>
                `
            };

        case 'resetPassword':
            return {
                subject: 'Reset Your Password - GlaciX',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #2563eb;">Reset Your Password</h2>
                        <p>Hi ${data.firstName},</p>
                        <p>You requested to reset your password for your GlaciX account.</p>
                        
                        <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 20px; margin: 20px 0;">
                            <p>Click the button below to reset your password. This link will expire in 1 hour.</p>
                        </div>
                        
                        <a href="${baseUrl}/reset-password?token=${data.resetToken}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">
                            Reset Password
                        </a>
                        
                        <p style="color: #666; font-size: 14px;">If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
                        
                        <p style="color: #666; font-size: 12px;">If the button doesn't work, copy and paste this link into your browser:<br>
                        ${baseUrl}/reset-password?token=${data.resetToken}</p>
                    </div>
                `
            };

        case 'weeklySummary':
            return {
                subject: 'Your Weekly GlaciX Summary',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #2563eb;">Your Weekly Summary</h2>
                        <p>Hi ${data.firstName},</p>
                        <p>Here's a summary of your GlaciX activity this week:</p>
                        
                        <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
                            <h3 style="margin: 0 0 15px 0; color: #1e293b;">This Week's Activity</h3>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                                <div>
                                    <p style="margin: 5px 0; font-weight: bold;">Appointments:</p>
                                    <p style="margin: 5px 0; font-size: 24px; color: #2563eb;">${data.appointmentCount}</p>
                                </div>
                                <div>
                                    <p style="margin: 5px 0; font-weight: bold;">Total Spent:</p>
                                    <p style="margin: 5px 0; font-size: 24px; color: #16a34a;">${data.totalSpent}</p>
                                </div>
                            </div>
                            <p><strong>Services Used:</strong> ${data.services.join(', ')}</p>
                            <p><strong>Current Points:</strong> ${data.currentPoints} points</p>
                        </div>
                        
                        ${data.currentPoints >= 1000 ? `
                        <div style="background-color: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0;">
                            <p style="margin: 0;"><strong>🎉 You can redeem a free service!</strong> You have enough points for a reward.</p>
                        </div>
                        ` : `
                        <div style="background-color: #e0f2fe; padding: 15px; border-radius: 5px; margin: 20px 0;">
                            <p style="margin: 0;"><strong>Keep going!</strong> You need ${1000 - data.currentPoints} more points for a free basic cleaning.</p>
                        </div>
                        `}
                        
                        <a href="${baseUrl}/book" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">
                            Book Next Appointment
                        </a>
                    </div>
                `
            };

        case 'promotional':
            return {
                subject: data.subject || 'Special Offer from GlaciX',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #dc2626;">${data.title || 'Special Offer!'}</h2>
                        <p>Hi ${data.firstName},</p>
                        
                        ${data.bannerImage ? `<img src="${data.bannerImage}" alt="Promotional Banner" style="width: 100%; height: auto; border-radius: 8px; margin: 20px 0;">` : ''}
                        
                        <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; margin: 20px 0;">
                            ${data.content || '<p>We have an exciting offer just for you!</p>'}
                        </div>
                        
                        ${data.discountCode ? `
                        <div style="text-align: center; background-color: #1f2937; color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <p style="margin: 0; font-size: 18px;">Use code:</p>
                            <p style="margin: 10px 0; font-size: 32px; font-weight: bold; letter-spacing: 2px;">${data.discountCode}</p>
                            <p style="margin: 0; font-size: 14px; opacity: 0.8;">Valid until ${data.expiryDate || 'limited time'}</p>
                        </div>
                        ` : ''}
                        
                        <a href="${baseUrl}/book${data.discountCode ? '?code=' + data.discountCode : ''}" style="background-color: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; font-size: 18px;">
                            ${data.ctaText || 'Book Now'}
                        </a>
                        
                        <p style="color: #666; font-size: 12px;">This offer is exclusive to our valued customers. Terms and conditions apply.</p>
                    </div>
                `
            };

        case 'contactForm':
            return {
                subject: `New Contact Form Submission - ${data.firstName} ${data.lastName}`,
                html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #26687D;">New Contact Form Submission</h2>
                <p>You have received a new message through the GlaciX contact form.</p>
                
                <div style="background-color: #f8fafc; border-left: 4px solid #26687D; padding: 20px; margin: 20px 0;">
                    <h3 style="margin: 0 0 15px 0;">Contact Details</h3>
                    <p><strong>Name:</strong> ${data.firstName} ${data.lastName}</p>
                    <p><strong>Email:</strong> ${data.email}</p>
                    <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
                </div>
                
                <div style="background-color: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
                    <h3 style="margin: 0 0 15px 0; color: #1e293b;">Message</h3>
                    <p style="white-space: pre-line; line-height: 1.6;">${data.message}</p>
                </div>
                
                <div style="background-color: #f0f9ff; border-radius: 8px; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0; font-size: 14px; color: #0369a1;">
                        <strong>Reply to:</strong> <a href="mailto:${data.email}" style="color: #0369a1;">${data.email}</a>
                    </p>
                </div>
            </div>
        `
            };

        default:
            return {
                subject: 'GlaciX Notification',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2>GlaciX Notification</h2>
                        <p>You have a new notification from GlaciX.</p>
                    </div>
                `
            };
    }
};

// Main email service class
export class EmailService {
    private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = createTransporter();
    }

    // Verify email configuration
    async verifyConnection(): Promise<boolean> {
        try {
            await this.transporter.verify();
            console.log('Email service connected successfully');
            return true;
        } catch (error) {
            console.error('Email service connection failed:', error);
            return false;
        }
    }

    // Send email
    async sendEmail(to: string, type: string, data: any): Promise<boolean> {
        try {
            const template = getEmailTemplate(type, data);

            const mailOptions = {
                from: `"GlaciX" <${config.email.from}>`,
                to: to,
                subject: template.subject,
                html: template.html
            };

            await this.transporter.sendMail(mailOptions);
            console.log(`Email sent successfully to ${to} (${type})`);
            return true;
        } catch (error) {
            console.error(`Failed to send email to ${to}:`, error);
            return false;
        }
    }

    // Specific email methods
    async sendWelcomeEmail(userEmail: string, userData: any): Promise<boolean> {
        return this.sendEmail(userEmail, 'welcome', userData);
    }

    async sendAppointmentConfirmation(userEmail: string, appointmentData: any): Promise<boolean> {
        return this.sendEmail(userEmail, 'appointmentConfirmation', appointmentData);
    }

    async sendAppointmentCancellation(userEmail: string, appointmentData: any): Promise<boolean> {
        return this.sendEmail(userEmail, 'appointmentCancellation', appointmentData);
    }

    async sendAppointmentReminder(userEmail: string, appointmentData: any): Promise<boolean> {
        return this.sendEmail(userEmail, 'appointmentReminder', appointmentData);
    }

    async sendPointsUpdate(userEmail: string, pointsData: any): Promise<boolean> {
        return this.sendEmail(userEmail, 'pointsUpdate', pointsData);
    }

    async sendPasswordReset(userEmail: string, resetData: any): Promise<boolean> {
        return this.sendEmail(userEmail, 'resetPassword', resetData);
    }

    // Send bulk emails
    async sendBulkEmails(recipients: Array<{email: string, data: any}>, type: string): Promise<number> {
        let successCount = 0;

        for (const recipient of recipients) {
            const success = await this.sendEmail(recipient.email, type, recipient.data);
            if (success) successCount++;

            // Add small delay to avoid overwhelming the email server
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        console.log(`Bulk email completed: ${successCount}/${recipients.length} emails sent successfully`);
        return successCount;
    }
}

// Export singleton instance
export const emailService = new EmailService();