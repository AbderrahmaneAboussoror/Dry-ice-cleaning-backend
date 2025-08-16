import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { AppointmentService } from '../services/appointmentService';
import { calculateAppointmentPrice, getPriceBreakdown } from '../services/pricingService';
import User from '../models/User';
import Appointment from "../models/Appointment";
import { emailService } from '../services/emailService';

interface AuthRequest extends Request {
    user?: any;
}

export const bookAppointment = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
            return;
        }

        const { serviceType, appointmentDate, location, notes } = req.body;
        const userId = req.user._id.toString();

        // Parse appointment date
        const requestedDate = new Date(appointmentDate);

        // Validate booking window
        const windowValidation = await AppointmentService.validateBookingWindow(requestedDate);
        if (!windowValidation.isValid) {
            res.status(400).json({ error: windowValidation.message });
            return;
        }

        // Check user appointment limit (3 max)
        const userAppointmentCount = await AppointmentService.getUserAppointmentCount(userId);
        if (userAppointmentCount >= 3) {
            res.status(400).json({
                error: 'Maximum appointment limit reached. You can have up to 3 active appointments.'
            });
            return;
        }

        // Find available time slot
        const availableSlot = await AppointmentService.findAvailableSlot(requestedDate);
        if (!availableSlot) {
            res.status(400).json({
                error: 'No available time slots for this date. Please choose another date.',
                suggestion: 'Try booking for the next day or check our availability calendar.'
            });
            return;
        }

        // Calculate price
        const appointmentPrice = calculateAppointmentPrice(serviceType, requestedDate);
        const priceBreakdown = getPriceBreakdown(serviceType, requestedDate);

        // Check user points balance
        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        if (user.totalPoints < appointmentPrice) {
            res.status(400).json({
                error: 'Insufficient points',
                required: appointmentPrice,
                available: user.totalPoints,
                shortfall: appointmentPrice - user.totalPoints
            });
            return;
        }

        // Create appointment
        const appointment = await AppointmentService.createAppointment({
            userId,
            serviceType,
            appointmentDate: requestedDate,
            location,
            timeSlot: availableSlot.timeSlot,
            startTime: availableSlot.startTime,
            endTime: availableSlot.endTime,
            price: appointmentPrice,
            notes
        });

        // Deduct points from user
        await AppointmentService.deductUserPoints(userId, appointmentPrice);

        console.log(`📧 Email would be sent to user: ${user.email}`);
        console.log(`📧 Email would be sent to company: ${process.env.COMPANY_EMAIL}`);

        // Send confirmation email (non-blocking)
        emailService.sendAppointmentConfirmation(user.email, appointment)
            .catch(error => console.error('Failed to send confirmation email:', error));

        const companyNotificationData = {
            customerName: `${user.firstName} ${user.lastName}`,
            customerEmail: user.email,
            serviceType: appointment.serviceType,
            appointmentDate: appointment.appointmentDate,
            timeSlot: appointment.timeSlot,
            location: appointment.location
        };

        emailService.sendEmail(process.env.COMPANY_EMAIL!, 'newBookingNotification', companyNotificationData)
            .catch(error => console.error('Failed to send company notification:', error));

        res.status(201).json({
            message: 'Appointment booked successfully',
            appointment: {
                id: appointment._id,
                serviceType: appointment.serviceType,
                appointmentDate: appointment.appointmentDate,
                timeSlot: appointment.timeSlot,
                location: appointment.location,
                status: appointment.status,
                priceBreakdown,
                createdAt: appointment.createdAt
            },
            userPointsRemaining: user.totalPoints - appointmentPrice
        });

    } catch (error: any) {
        console.error('Book appointment error:', error);
        res.status(500).json({ error: 'Failed to book appointment' });
    }
};

export const getUserAppointments = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user._id;

        const appointments = await Appointment.find({ userId })
            .sort({ appointmentDate: 1, startTime: 1 })
            .select('-userId');

        res.json({
            appointments: appointments.map(apt => ({
                id: apt._id,
                serviceType: apt.serviceType,
                appointmentDate: apt.appointmentDate,
                timeSlot: apt.timeSlot,
                location: apt.location,
                status: apt.status,
                price: apt.price,
                notes: apt.notes,
                createdAt: apt.createdAt
            }))
        });

    } catch (error) {
        console.error('Get user appointments error:', error);
        res.status(500).json({ error: 'Failed to get appointments' });
    }
};

export const cancelAppointment = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { appointmentId } = req.params;
        const userId = req.user._id;

        const appointment = await Appointment.findOne({
            _id: appointmentId,
            userId: userId
        });

        if (!appointment) {
            res.status(404).json({ error: 'Appointment not found' });
            return;
        }

        if (appointment.status === 'cancelled') {
            res.status(400).json({ error: 'Appointment is already cancelled' });
            return;
        }

        if (appointment.status === 'completed') {
            res.status(400).json({ error: 'Cannot cancel completed appointment' });
            return;
        }

        // Update appointment status
        appointment.status = 'cancelled';
        await appointment.save();

        // Refund points to user
        await User.findByIdAndUpdate(
            userId,
            { $inc: { totalPoints: appointment.price } }
        );

        const user = await User.findById(userId);

        emailService.sendAppointmentCancellation(user!.email, appointment)
            .catch(error => console.error('Failed to send cancellation email:', error));

        res.json({
            message: 'Appointment cancelled successfully',
            refundedPoints: appointment.price
        });

    } catch (error) {
        console.error('Cancel appointment error:', error);
        res.status(500).json({ error: 'Failed to cancel appointment' });
    }
};

//export const sendAppointmentReminders = async (): Promise<void> => {
//     try {
//         const tomorrow = new Date();
//         tomorrow.setDate(tomorrow.getDate() + 1);
//         tomorrow.setHours(0, 0, 0, 0);
//
//         const dayAfter = new Date(tomorrow);
//         dayAfter.setDate(dayAfter.getDate() + 1);
//
//         // Find appointments for tomorrow
//         const tomorrowAppointments = await Appointment.find({
//             appointmentDate: {
//                 $gte: tomorrow,
//                 $lt: dayAfter
//             },
//             status: { $in: ['pending', 'confirmed'] }
//         }).populate('userId', 'firstName lastName email');
//
//         // Send reminder emails
//         const emailPromises = tomorrowAppointments.map(appointment => {
//             const reminderData = {
//                 firstName: appointment.userId.firstName,
//                 serviceType: appointment.serviceType,
//                 timeSlot: appointment.timeSlot,
//                 location: appointment.location
//             };
//
//             return emailService.sendAppointmentReminder(appointment.userId.email, reminderData);
//         });
//
//         await Promise.all(emailPromises);
//         console.log(`Sent ${tomorrowAppointments.length} appointment reminder emails`);
//     } catch (error) {
//         console.error('Error sending appointment reminders:', error);
//     }
// };