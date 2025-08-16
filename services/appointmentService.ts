import Appointment from "../models/Appointment";
import User from '../models/User';
import { Types } from 'mongoose';
import {addMonths, createDateTimeFromSlot, getTimeSlots} from "../utils/dateUtils";
import {ServiceType} from "../services/pricingService";

export class AppointmentService {

    static async findAvailableSlot(requestedDate: Date): Promise<{ timeSlot: string, startTime: Date, endTime: Date } | null> {
        // Set to start of day to compare dates only
        const startOfDay = new Date(requestedDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(requestedDate);
        endOfDay.setHours(23, 59, 59, 999);

        // Find existing appointments for that day
        const existingAppointments = await Appointment.find({
            appointmentDate: {
                $gte: startOfDay,
                $lte: endOfDay
            },
            status: { $in: ['pending', 'confirmed', 'in_progress'] }
        }).sort({ startTime: 1 });

        // Get all possible time slots
        const allTimeSlots = getTimeSlots();
        const bookedSlots = existingAppointments.map(apt => apt.timeSlot);

        // Find first available slot
        for (const timeSlot of allTimeSlots) {
            if (!bookedSlots.includes(timeSlot)) {
                const { startTime, endTime } = createDateTimeFromSlot(requestedDate, timeSlot);
                return { timeSlot, startTime, endTime };
            }
        }

        return null; // No available slots
    }

    static async getUserAppointmentCount(userId: string): Promise<number> {
        return await Appointment.countDocuments({
            userId: new Types.ObjectId(userId),
            status: { $in: ['pending', 'confirmed', 'in_progress'] }
        });
    }

    static async validateBookingWindow(requestedDate: Date): Promise<{ isValid: boolean, message?: string }> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const requestedDateOnly = new Date(requestedDate);
        requestedDateOnly.setHours(0, 0, 0, 0);

        // Check if date is in the past
        if (requestedDateOnly < today) {
            return {
                isValid: false,
                message: 'Cannot book appointments in the past'
            };
        }

        // Check if date is within 3 months
        const threeMonthsFromNow = addMonths(today, 3);

        if (requestedDateOnly <= threeMonthsFromNow) {
            return { isValid: true };
        }

        // Check if all dates in next 3 months are fully booked
        const fullyBookedDates = await this.getFullyBookedDatesInRange(today, threeMonthsFromNow);
        const totalDaysInRange = Math.ceil((threeMonthsFromNow.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        // If all days in 3 months are booked, extend to 6 months
        if (fullyBookedDates.length >= totalDaysInRange) {
            const sixMonthsFromNow = addMonths(today, 6);

            if (requestedDateOnly <= sixMonthsFromNow) {
                return { isValid: true };
            } else {
                return {
                    isValid: false,
                    message: 'Booking window extended to 6 months due to high demand. Please choose a date within 6 months.'
                };
            }
        }

        return {
            isValid: false,
            message: 'Please choose a date within the next 3 months'
        };
    }

    static async getFullyBookedDatesInRange(startDate: Date, endDate: Date): Promise<string[]> {
        const pipeline = [
            {
                $match: {
                    appointmentDate: {
                        $gte: startDate,
                        $lte: endDate
                    },
                    status: { $in: ['pending', 'confirmed', 'in_progress'] }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$appointmentDate" }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $match: {
                    count: { $gte: 4 } // 4 slots per day means fully booked
                }
            }
        ];

        const result = await Appointment.aggregate(pipeline);
        return result.map(item => item._id);
    }

    static async createAppointment(appointmentData: {
        userId: string;
        serviceType: ServiceType;
        appointmentDate: Date;
        location: string;
        timeSlot: string;
        startTime: Date;
        endTime: Date;
        price: number;
        notes?: string;
    }) {
        const appointment = new Appointment({
            userId: new Types.ObjectId(appointmentData.userId),
            serviceType: appointmentData.serviceType,
            appointmentDate: appointmentData.appointmentDate,
            timeSlot: appointmentData.timeSlot,
            startTime: appointmentData.startTime,
            endTime: appointmentData.endTime,
            location: appointmentData.location,
            status: 'confirmed',
            price: appointmentData.price,
            notes: appointmentData.notes
        });

        return await appointment.save();
    }

    static async deductUserPoints(userId: string, points: number): Promise<void> {
        await User.findByIdAndUpdate(
            userId,
            { $inc: { totalPoints: -points } },
            { new: true }
        );
    }
}