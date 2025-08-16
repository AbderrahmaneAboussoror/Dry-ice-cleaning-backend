import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import User, { IUser } from '../models/User';
import Appointment from '../models/Appointment';
import {emailService} from "../services/emailService";

interface AuthRequest extends Request {
    user?: any;
}

// ========== USER MANAGEMENT ==========

/**
 * Get all users with pagination and filtering
 */
export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const search = req.query.search as string;
        const isActive = req.query.isActive as string;

        // Build filter object
        const filter: any = {};

        // Search by name or email
        if (search) {
            filter.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        // Filter by active status
        if (isActive !== undefined) {
            filter.isActive = isActive === 'true';
        }

        // Calculate skip value for pagination
        const skip = (page - 1) * limit;

        // Get users with pagination
        const users = await User.find(filter)
            .select('-password') // Exclude password field
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Get total count for pagination
        const total = await User.countDocuments(filter);
        const pages = Math.ceil(total / limit);

        res.json({
            success: true,
            data: users,
            pagination: {
                page,
                limit,
                total,
                pages
            }
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users'
        });
    }
};

/**
 * Create new user account
 */
export const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { firstName, lastName, email, password, phoneNumber, address, totalPoints = 0 } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            res.status(409).json({
                success: false,
                message: 'User with this email already exists'
            });
            return;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create new user
        const newUser = new User({
            firstName,
            lastName,
            email: email.toLowerCase(),
            password: hashedPassword,
            phoneNumber,
            address,
            totalPoints: totalPoints,
            role: 'user', // Default role
            isActive: true
        });

        await newUser.save();

        // Return user without password
        const userResponse = newUser.toObject();
        const { password: _, ...userWithoutPassword } = userResponse;

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: userWithoutPassword
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create user'
        });
    }
};

/**
 * Update user account
 */
export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.params.id;
        const { firstName, lastName, email, phoneNumber, address, isActive } = req.body;

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
            return;
        }

        // If email is being updated, check if it's already taken
        if (email && email.toLowerCase() !== user.email) {
            const existingUser = await User.findOne({ email: email.toLowerCase() });
            if (existingUser) {
                res.status(409).json({
                    success: false,
                    message: 'Email already in use'
                });
                return;
            }
        }

        // Update user fields
        const updateData: any = {};
        if (firstName) updateData.firstName = firstName;
        if (lastName) updateData.lastName = lastName;
        if (email) updateData.email = email.toLowerCase();
        if (phoneNumber) updateData.phoneNumber = phoneNumber;
        if (address) updateData.address = address;
        if (isActive !== undefined) updateData.isActive = isActive;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        res.json({
            success: true,
            message: 'User updated successfully',
            data: updatedUser
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user'
        });
    }
};

/**
 * Delete user account (soft delete)
 */
export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.params.id;

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
            return;
        }

        // Prevent admin from deleting themselves
        if (userId === req.user!._id.toString()) {
            res.status(400).json({
                success: false,
                message: 'You cannot delete your own account'
            });
            return;
        }

        // Soft delete - set isActive to false
        await User.findByIdAndUpdate(userId, { isActive: false });

        res.json({
            success: true,
            message: 'User account deactivated successfully'
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete user'
        });
    }
};

/**
 * Update user points (admin version)
 */
export const updateUserPoints = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.params.id;
        const { points, operation, reason } = req.body;

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {

            res.status(404).json({
                success: false,
                message: 'User not found'
            });
            return;
        }

        let newPointsTotal;

        switch (operation) {
            case 'add':
                newPointsTotal = user.totalPoints + points;
                break;
            case 'subtract':
                newPointsTotal = user.totalPoints - points;
                if (newPointsTotal < 0) {
                    res.status(400).json({
                        success: false,
                        message: 'Insufficient points. User only has ' + user.totalPoints + ' points.'
                    });
                    return;
                }
                break;
            case 'set':
                newPointsTotal = points;
                break;
            default:
                res.status(400).json({
                    success: false,
                    message: 'Invalid operation. Use add, subtract, or set.'
                });
                return;
        }

        // Update user points
        user.totalPoints = newPointsTotal;
        await user.save();

        // Log the admin action (you can expand this later)
        console.log(`Admin ${req.user!.email} ${operation}ed ${points} points for user ${user.email}. Reason: ${reason || 'No reason provided'}`);

        const updatedUser = await User.findById(userId).select('-password');

        res.json({
            success: true,
            message: `Successfully ${operation}ed ${points} points`,
            data: updatedUser
        });
    } catch (error) {
        console.error('Error updating user points:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update points'
        });
    }
};

// ========== APPOINTMENT MANAGEMENT ==========

/**
 * Get upcoming appointments with filtering
 */
export const getUpcomingAppointments = async (req: AuthRequest, res: Response) => {
    try {
        const { week, status, serviceType, date } = req.query;
        const currentDate = new Date();

        // Build filter object
        const filter: any = {
            startTime: { $gte: currentDate } // Only future appointments
        };

        // Filter by status
        if (status) {
            filter.status = status;
        }

        // Filter by service type
        if (serviceType) {
            filter.serviceType = serviceType;
        }

        // Filter by specific date
        if (date) {
            const targetDate = new Date(date as string);
            const nextDay = new Date(targetDate);
            nextDay.setDate(nextDay.getDate() + 1);

            filter.appointmentDate = {
                $gte: targetDate,
                $lt: nextDay
            };
        }

        // Filter by current week
        if (week === 'true') {
            const startOfWeek = new Date(currentDate);
            startOfWeek.setDate(currentDate.getDate() - currentDate.getDay()); // Sunday
            startOfWeek.setHours(0, 0, 0, 0);

            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 7);

            filter.appointmentDate = {
                $gte: startOfWeek,
                $lt: endOfWeek
            };
        }

        // Get appointments with user details
        const appointments = await Appointment.find(filter)
            .populate('userId', 'firstName lastName email phoneNumber')
            .sort({ appointmentDate: 1, startTime: 1 });

        res.json({
            success: true,
            data: appointments,
            count: appointments.length,
            filters: { week, status, serviceType, date }
        });
    } catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch appointments'
        });
    }
};

/**
 * Cancel an appointment
 */
export const cancelAppointment = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const appointmentId = req.params.id;
        const { reason } = req.body;

        // Find appointment
        const appointment = await Appointment.findById(appointmentId)
            .populate('userId', 'firstName lastName email');

        if (!appointment) {
            res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
            return;
        }

        // Check if appointment can be cancelled
        if (appointment.status === 'cancelled') {
            res.status(400).json({
                success: false,
                message: 'Appointment is already cancelled'
            });
            return;
        }

        if (appointment.status === 'completed') {
            res.status(400).json({
                success: false,
                message: 'Cannot cancel a completed appointment'
            });
            return;
        }

        // Update appointment status
        appointment.status = 'cancelled';
        if (reason) {
            appointment.notes = appointment.notes
                ? `${appointment.notes}\n\nCancelled by admin: ${reason}`
                : `Cancelled by admin: ${reason}`;
        }

        await appointment.save();

        // Log admin action
        console.log(`Admin ${req.user!.email} cancelled appointment ${appointmentId}. Reason: ${reason || 'No reason provided'}`);

        const user = await User.findById(appointment.userId);

        emailService.sendAppointmentCancellation(user!.email, appointment)
            .catch(error => console.error('Failed to send cancellation email:', error));

        // Safely access populated user data
        const populatedUser = appointment.userId as any;
        const customerName = populatedUser
            ? `${populatedUser.firstName} ${populatedUser.lastName}`
            : 'Unknown Customer';

        res.json({
            success: true,
            message: 'Appointment cancelled successfully',
            data: {
                appointmentId: appointment._id,
                customerName,
                appointmentDate: appointment.appointmentDate,
                timeSlot: appointment.timeSlot,
                reason: reason || 'No reason provided'
            }
        });
    } catch (error) {
        console.error('Error cancelling appointment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel appointment'
        });
    }
};