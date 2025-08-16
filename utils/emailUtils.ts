import cron from 'node-cron';
import { emailService } from '../services/emailService';
import User, {IUser} from "../models/User";
import Appointment from "../models/Appointment";

// ========== EMAIL VALIDATION UTILITIES ==========

export const validateEmailAddress = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const normalizeEmail = (email: string): string => {
    return email.toLowerCase().trim();
};

// ========== RESET TOKEN UTILITIES ==========

export const generateResetToken = (): string => {
    return require('crypto').randomBytes(32).toString('hex');
};

export const verifyResetToken = async (token: string): Promise<any> => {
    return await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpiry: { $gt: new Date() }
    });
};

// ========== EMAIL SCHEDULING & AUTOMATION ==========

export class EmailScheduler {

    // Initialize all scheduled email tasks
    static initializeScheduler(): void {
        console.log('Initializing email scheduler...');

        // Send appointment reminders daily at 9 AM
        cron.schedule('0 9 * * *', async () => {
            console.log('Running daily appointment reminder task...');
            await this.sendDailyAppointmentReminders();
        }, {
            timezone: "Europe/Copenhagen" // Adjust timezone as needed
        });

        // Send weekly summary emails on Sundays at 10 AM
        cron.schedule('0 10 * * 0', async () => {
            console.log('Running weekly summary task...');
            await this.sendWeeklySummaries();
        }, {
            timezone: "Europe/Copenhagen"
        });

        // Clean up expired reset tokens daily at midnight
        cron.schedule('0 0 * * *', async () => {
            console.log('Cleaning up expired reset tokens...');
            await this.cleanupExpiredTokens();
        });

        console.log('Email scheduler initialized successfully');
    }

    // Send appointment reminders for tomorrow
    static async sendDailyAppointmentReminders(): Promise<void> {
        try {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);

            const dayAfter = new Date(tomorrow);
            dayAfter.setDate(dayAfter.getDate() + 1);

            const tomorrowAppointments = await Appointment.find({
                appointmentDate: {
                    $gte: tomorrow,
                    $lt: dayAfter
                },
                status: { $in: ['pending', 'confirmed'] }
            }).populate('userId', 'firstName lastName email');

            let successCount = 0;

            for (const appointment of tomorrowAppointments) {
                const user = appointment.userId as unknown as IUser;

                const reminderData = {
                    firstName: user.firstName,
                    serviceType: appointment.serviceType,
                    timeSlot: appointment.timeSlot,
                    location: appointment.location
                };

                const success = await emailService.sendAppointmentReminder(
                    user.email,
                    reminderData
                );

                if (success) successCount++;

                // Small delay to avoid overwhelming email server
                await new Promise(resolve => setTimeout(resolve, 200));
            }

            console.log(`Daily reminders: ${successCount}/${tomorrowAppointments.length} emails sent`);
        } catch (error) {
            console.error('Error sending daily appointment reminders:', error);
        }
    }

    // Send weekly summary emails to active users
    static async sendWeeklySummaries(): Promise<void> {
        try {
            const lastWeek = new Date();
            lastWeek.setDate(lastWeek.getDate() - 7);

            // Get users with appointments in the last week
            const recentAppointments = await Appointment.find({
                createdAt: { $gte: lastWeek },
                status: { $ne: 'cancelled' }
            }).populate('userId', 'firstName lastName email totalPoints');

            const userSummaries = new Map();

            // Aggregate data by user
            recentAppointments.forEach(appointment => {
                const userId = appointment.userId._id.toString();
                if (!userSummaries.has(userId)) {
                    userSummaries.set(userId, {
                        user: appointment.userId,
                        appointmentCount: 0,
                        totalSpent: 0,
                        services: []
                    });
                }

                const summary = userSummaries.get(userId);
                summary.appointmentCount++;
                summary.totalSpent += appointment.price;
                summary.services.push(appointment.serviceType);
            });

            // Send summary emails
            let successCount = 0;
            for (const [userId, summary] of userSummaries) {
                const summaryData = {
                    firstName: summary.user.firstName,
                    appointmentCount: summary.appointmentCount,
                    totalSpent: summary.totalSpent,
                    services: [...new Set(summary.services)], // Remove duplicates
                    currentPoints: summary.user.totalPoints
                };

                const success = await emailService.sendEmail(
                    summary.user.email,
                    'weeklySummary',
                    summaryData
                );

                if (success) successCount++;
                await new Promise(resolve => setTimeout(resolve, 300));
            }

            console.log(`Weekly summaries: ${successCount}/${userSummaries.size} emails sent`);
        } catch (error) {
            console.error('Error sending weekly summaries:', error);
        }
    }

    // Clean up expired password reset tokens
    static async cleanupExpiredTokens(): Promise<void> {
        try {
            const result = await User.updateMany(
                {
                    resetPasswordExpiry: { $lt: new Date() }
                },
                {
                    $unset: {
                        resetPasswordToken: 1,
                        resetPasswordExpiry: 1
                    }
                }
            );

            console.log(`Cleaned up ${result.modifiedCount} expired reset tokens`);
        } catch (error) {
            console.error('Error cleaning up expired tokens:', error);
        }
    }

    // Send bulk promotional emails (for admin use)
    static async sendPromotionalEmail(userIds: string[], emailType: string, data: any): Promise<number> {
        try {
            const users = await User.find({
                _id: { $in: userIds },
                isActive: true
            }).select('firstName lastName email');

            const recipients = users.map(user => ({
                email: user.email,
                data: {
                    firstName: user.firstName,
                    lastName: user.lastName,
                    ...data
                }
            }));

            return await emailService.sendBulkEmails(recipients, emailType);
        } catch (error) {
            console.error('Error sending promotional emails:', error);
            return 0;
        }
    }
}

// ========== EMAIL QUEUE SYSTEM (Optional Advanced Feature) ==========

interface EmailJob {
    id: string;
    to: string;
    type: string;
    data: any;
    attempts: number;
    maxAttempts: number;
    scheduledFor: Date;
    createdAt: Date;
}

export class EmailQueue {
    private static queue: EmailJob[] = [];
    private static isProcessing = false;

    // Add email to queue
    static addToQueue(to: string, type: string, data: any, scheduledFor?: Date): string {
        const jobId = require('crypto').randomBytes(16).toString('hex');

        const job: EmailJob = {
            id: jobId,
            to,
            type,
            data,
            attempts: 0,
            maxAttempts: 3,
            scheduledFor: scheduledFor || new Date(),
            createdAt: new Date()
        };

        this.queue.push(job);
        console.log(`Email job added to queue: ${jobId}`);

        // Start processing if not already running
        if (!this.isProcessing) {
            this.processQueue();
        }

        return jobId;
    }

    // Process email queue
    static async processQueue(): Promise<void> {
        if (this.isProcessing) return;

        this.isProcessing = true;

        while (this.queue.length > 0) {
            const now = new Date();
            const jobIndex = this.queue.findIndex(job => job.scheduledFor <= now);

            if (jobIndex === -1) {
                // No jobs ready to process, wait a bit
                await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds
                continue;
            }

            const job = this.queue[jobIndex];

            try {
                const success = await emailService.sendEmail(job.to, job.type, job.data);

                if (success) {
                    // Remove successful job from queue
                    this.queue.splice(jobIndex, 1);
                    console.log(`Email job completed: ${job.id}`);
                } else {
                    // Retry failed job
                    job.attempts++;
                    if (job.attempts >= job.maxAttempts) {
                        console.error(`Email job failed permanently: ${job.id}`);
                        this.queue.splice(jobIndex, 1);
                    } else {
                        // Reschedule for retry (exponential backoff)
                        const delay = Math.pow(2, job.attempts) * 60000; // 2^attempts minutes
                        job.scheduledFor = new Date(Date.now() + delay);
                        console.log(`Email job rescheduled for retry: ${job.id} (attempt ${job.attempts})`);
                    }
                }
            } catch (error) {
                console.error(`Error processing email job ${job.id}:`, error);
                job.attempts++;
                if (job.attempts >= job.maxAttempts) {
                    this.queue.splice(jobIndex, 1);
                }
            }

            // Small delay between jobs
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        this.isProcessing = false;
    }

    // Get queue status
    static getQueueStatus(): { total: number; pending: number; scheduled: number } {
        const now = new Date();
        const pending = this.queue.filter(job => job.scheduledFor <= now).length;
        const scheduled = this.queue.filter(job => job.scheduledFor > now).length;

        return {
            total: this.queue.length,
            pending,
            scheduled
        };
    }
}

// ========== EMAIL TESTING UTILITIES ==========

export class EmailTester {
    // Test email configuration
    static async testEmailConfig(): Promise<boolean> {
        try {
            const isConnected = await emailService.verifyConnection();
            if (!isConnected) {
                console.error('Email service connection failed');
                return false;
            }

            console.log('Email configuration is valid');
            return true;
        } catch (error) {
            console.error('Email configuration test failed:', error);
            return false;
        }
    }

    // Send test email
    static async sendTestEmail(to: string): Promise<boolean> {
        const testData = {
            firstName: 'Test',
            lastName: 'User'
        };

        try {
            const success = await emailService.sendEmail(to, 'welcome', testData);
            if (success) {
                console.log(`Test email sent successfully to ${to}`);
            } else {
                console.error(`Failed to send test email to ${to}`);
            }
            return success;
        } catch (error) {
            console.error('Test email failed:', error);
            return false;
        }
    }
}

// ========== EXPORT INITIALIZATION FUNCTION ==========

export const initializeEmailSystem = async (): Promise<void> => {
    console.log('Initializing email system...');

    // Test email configuration
    const configValid = await EmailTester.testEmailConfig();
    if (!configValid) {
        console.warn('Email system started with invalid configuration');
        return;
    }

    // Initialize scheduler
    EmailScheduler.initializeScheduler();

    console.log('Email system initialized successfully');
};