import { body } from 'express-validator';

export const bookAppointmentValidation = [
    body('serviceType')
        .isIn(['basic', 'deluxe'])
        .withMessage('Service type must be either "basic" or "deluxe"'),

    body('appointmentDate')
        .isISO8601()
        .withMessage('Please provide a valid date in ISO8601 format (YYYY-MM-DD)'),

    body('location')
        .trim()
        .isLength({ min: 5, max: 200 })
        .withMessage('Location must be between 5 and 200 characters'),

    body('notes')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Notes cannot exceed 500 characters')
];