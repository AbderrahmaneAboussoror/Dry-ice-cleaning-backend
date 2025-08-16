import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { emailService } from '../services/emailService';

export interface ContactFormData {
    firstName: string;
    lastName: string;
    email: string;
    message: string;
}

export const submitContactForm = async (req: Request, res: Response): Promise<void> => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors.array()
            });
            return;
        }

        const { firstName, lastName, email, message }: ContactFormData = req.body;

        // Prepare data for email template
        const emailData = {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim().toLowerCase(),
            message: message.trim()
        };

        // Send email to company
        const emailSent = await emailService.sendEmail(
            'aboussororabderrahmane@gmail.com',
            'contactForm',
            emailData
        );

        if (!emailSent) {
            res.status(500).json({
                success: false,
                error: 'Failed to send message. Please try again later.'
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Thank you for your message! We will get back to you soon.'
        });

    } catch (error: any) {
        console.error('Contact form submission error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error. Please try again later.'
        });
    }
};