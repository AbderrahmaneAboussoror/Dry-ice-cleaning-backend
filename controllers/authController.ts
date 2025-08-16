import { Request, Response } from 'express';
import User from '../models/User';
import { generateToken, hashPassword, comparePassword } from '../utils/auth';
import { validationResult } from 'express-validator';
import { Types } from 'mongoose';
import { emailService } from '../services/emailService';

interface AuthRequest extends Request {
    user?: any;
}

export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
            return;
        }

        const { firstName, lastName, email, phoneNumber, password, address } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            res.status(409).json({ error: 'User with this email already exists' });
            return;
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Create user
        const user = new User({
            firstName,
            lastName,
            email: email.toLowerCase(),
            phoneNumber,
            password: hashedPassword,
            address
        });

        await user.save();

        // Generate token
        const token = generateToken((user._id as Types.ObjectId).toString());

        // Return user data (without password) and token
        const userResponse = {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phoneNumber: user.phoneNumber,
            address: user.address,
            totalPoints: user.totalPoints,
            role: user.role
        };

        // Send welcome email (non-blocking)
        emailService.sendWelcomeEmail(user.email, user)
            .catch(error => console.error('Failed to send welcome email:', error));

        res.status(201).json({
            message: 'User registered successfully',
            user: userResponse,
            token
        });

    } catch (error: any) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Failed to register user' });
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
            return;
        }

        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            res.status(401).json({ error: 'Invalid email or password' });
            return;
        }

        // Check if user is active
        if (!user.isActive) {
            res.status(401).json({ error: 'Account is deactivated' });
            return;
        }

        // Verify password
        const isPasswordValid = await comparePassword(password, user.password);
        if (!isPasswordValid) {
            res.status(401).json({ error: 'Invalid email or password' });
            return;
        }

        // Generate token
        const token = generateToken((user._id as Types.ObjectId).toString());

        // Return user data (without password) and token
        const userResponse = {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phoneNumber: user.phoneNumber,
            address: user.address,
            totalPoints: user.totalPoints,
            role: user.role
        };

        res.json({
            message: 'Login successful',
            user: userResponse,
            token
        });

    } catch (error: any) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Failed to login' });
    }
};

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userResponse = {
            id: req.user._id,
            firstName: req.user.firstName,
            lastName: req.user.lastName,
            email: req.user.email,
            phoneNumber: req.user.phoneNumber,
            address: req.user.address,
            totalPoints: req.user.totalPoints,
            role: req.user.role,
            createdAt: req.user.createdAt
        };

        res.json({ user: userResponse });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to get profile' });
    }
};

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

        const { firstName, lastName, phoneNumber, address } = req.body;
        const userId = req.user._id;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { firstName, lastName, phoneNumber, address },
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.json({
            message: 'Profile updated successfully',
            user: updatedUser
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
};

//xport const forgotPassword = async (req: Request, res: Response): Promise<void> => {
//     try {
//         const { email } = req.body;
//
//         const user = await User.findOne({ email: email.toLowerCase() });
//         if (!user) {
//             res.status(404).json({
//                 success: false,
//                 message: 'User not found'
//             });
//             return;
//         }
//
//         // Generate reset token (you'll need to implement this)
//         const resetToken = generateResetToken(); // Implement this function
//         const resetExpiry = new Date(Date.now() + 3600000); // 1 hour
//
//         // Save reset token to user
//         user.resetPasswordToken = resetToken;
//         user.resetPasswordExpiry = resetExpiry;
//         await user.save();
//
//         // Send reset email
//         const resetData = {
//             firstName: user.firstName,
//             resetToken: resetToken
//         };
//
//         const emailSent = await emailService.sendPasswordReset(user.email, resetData);
//
//         if (emailSent) {
//             res.json({
//                 success: true,
//                 message: 'Password reset link sent to your email'
//             });
//         } else {
//             res.status(500).json({
//                 success: false,
//                 message: 'Failed to send reset email'
//             });
//         }
//     } catch (error) {
//         console.error('Error in forgotPassword:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Failed to process password reset request'
//         });
//     }
// };