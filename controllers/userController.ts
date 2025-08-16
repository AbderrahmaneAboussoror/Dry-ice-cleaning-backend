import { Request, Response } from 'express';
import { Types } from 'mongoose';
import User from '../models/User';
import { hashPassword, comparePassword } from '../utils/auth';
import { validationResult } from 'express-validator';
import Purchase from "../models/Purchase";
import Appointment from "../models/Appointment";

interface AuthRequest extends Request {
    user?: any;
}

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
            return;
        }

        const { firstName, lastName, email, phoneNumber, address } = req.body;
        const userId = req.user._id;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                firstName: firstName?.trim(),
                lastName: lastName?.trim(),
                email: email?.trim(),
                phoneNumber: phoneNumber?.trim(),
                address: address?.trim()
            },
            {
                new: true,
                runValidators: true,
                fields: '-password' // Exclude password from response
            }
        );

        if (!updatedUser) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.json({
            message: 'Profile updated successfully',
            user: updatedUser
        });

    } catch (error: any) {
        console.error('Update profile error:', error);

        // Handle validation errors
        if (error.name === 'ValidationError') {
            res.status(400).json({
                error: 'Validation failed',
                details: Object.values(error.errors).map((err: any) => err.message)
            });
            return;
        }

        res.status(500).json({ error: 'Failed to update profile' });
    }
};

export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
            return;
        }

        const { currentPassword, newPassword } = req.body;
        const userId = req.user._id;

        // Get user with password
        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        // Verify current password
        const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            res.status(400).json({ error: 'Current password is incorrect' });
            return;
        }

        // Hash new password
        const hashedNewPassword = await hashPassword(newPassword);

        // Update password
        await User.findByIdAndUpdate(userId, { password: hashedNewPassword });

        res.json({ message: 'Password changed successfully' });

    } catch (error: any) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Failed to change password' });
    }
};

export const changeEmail = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
            return;
        }

        const { newEmail, password } = req.body;
        const userId = req.user._id;

        // Get user with password
        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        // Verify password
        const isPasswordValid = await comparePassword(password, user.password);
        if (!isPasswordValid) {
            res.status(400).json({ error: 'Password is incorrect' });
            return;
        }

        // Check if new email is already in use
        const existingUser = await User.findOne({
            email: newEmail.toLowerCase(),
            _id: { $ne: userId } // Exclude current user
        });

        if (existingUser) {
            res.status(409).json({ error: 'Email is already in use' });
            return;
        }

        // Update email
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { email: newEmail.toLowerCase() },
            { new: true, runValidators: true, fields: '-password' }
        );

        res.json({
            message: 'Email changed successfully',
            user: updatedUser
        });

    } catch (error: any) {
        console.error('Change email error:', error);
        res.status(500).json({ error: 'Failed to change email' });
    }
};

export const deleteAccount = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
            return;
        }

        const { password } = req.body;
        const userId = req.user._id;

        // Get user with password
        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        // Verify password
        const isPasswordValid = await comparePassword(password, user.password);
        if (!isPasswordValid) {
            res.status(400).json({ error: 'Password is incorrect' });
            return;
        }

        // Soft delete - set isActive to false instead of actually deleting
        await User.findByIdAndUpdate(userId, { isActive: false });

        res.json({ message: 'Account deleted successfully' });

    } catch (error: any) {
        console.error('Delete account error:', error);
        res.status(500).json({ error: 'Failed to delete account' });
    }
};

export const updateUserPoints = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
            return;
        }

        const { points, operation, reason } = req.body;
        const userId = req.user._id;

        // Get current user
        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        let pointsChange = 0;
        let newTotal = user.totalPoints;

        switch (operation) {
            case 'add':
                pointsChange = points;
                newTotal = user.totalPoints + points;
                break;
            case 'subtract':
                pointsChange = -points;
                newTotal = user.totalPoints - points;

                // Prevent negative balance
                if (newTotal < 0) {
                    res.status(400).json({
                        error: 'Insufficient points',
                        currentBalance: user.totalPoints,
                        requestedDeduction: points,
                        shortfall: points - user.totalPoints
                    });
                    return;
                }
                break;
            case 'set':
                pointsChange = points - user.totalPoints;
                newTotal = points;
                break;
            default:
                res.status(400).json({ error: 'Invalid operation. Use "add", "subtract", or "set"' });
                return;
        }

        // Update user points
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { totalPoints: newTotal },
            { new: true, fields: '-password' }
        );

        // Log the transaction (you might want to create a PointsTransaction model later)
        console.log(`Points transaction for user ${userId}: ${operation} ${points} points. Reason: ${reason || 'No reason provided'}`);

        res.json({
            message: `Points ${operation}ed successfully`,
            pointsTransaction: {
                operation,
                pointsChanged: pointsChange,
                reason: reason || 'No reason provided',
                previousBalance: user.totalPoints,
                newBalance: newTotal
            },
            user: {
                id: updatedUser!._id,
                firstName: updatedUser!.firstName,
                lastName: updatedUser!.lastName,
                email: updatedUser!.email,
                totalPoints: updatedUser!.totalPoints
            }
        });

    } catch (error: any) {
        console.error('Update points error:', error);
        res.status(500).json({ error: 'Failed to update points' });
    }
};

export const getUserProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = await User.findById(req.user._id).select('-password');

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.json({ user });
    } catch (error) {
        console.error('Get user profile error:', error);
        res.status(500).json({ error: 'Failed to get user profile' });
    }
};

// Get user's purchase history
export const getUserPurchases = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!._id;

        const purchases = await Purchase.find({
            userId,
            status: 'succeeded',
            $or: [
                { pointsAwarded: { $gt: 0 } },
                { bonusPointsAwarded: { $gt: 0 } }
            ]
        })
            .populate('packId')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: purchases
        });
    } catch (error) {
        console.error('Error fetching user purchases:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch purchases'
        });
    }
};

// Get user's booking history (completed appointments)
export const getUserBookings = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!._id;
        const currentDate = new Date();

        // Get past completed appointments
        const completedBookings = await Appointment.find({
            userId,
            endTime: { $lt: currentDate }, // Past appointments (using endTime for accuracy)
            status: { $in: ['completed', 'confirmed'] } // Both completed and confirmed past appointments
        })
            .sort({ appointmentDate: -1 }) // Most recent first
            .select('-__v'); // Exclude version field

        res.json({
            success: true,
            data: completedBookings,
            count: completedBookings.length
        });
    } catch (error) {
        console.error('Error fetching user bookings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch booking history'
        });
    }
};