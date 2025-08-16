import { body, param } from 'express-validator';

// ========== USER MANAGEMENT VALIDATION ==========

/**
 * Validation for creating a new user
 */
export const createUserValidation = [
    body('firstName')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('First name must be between 2 and 50 characters')
        .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
        .withMessage('First name can only contain letters and spaces'),

    body('lastName')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Last name must be between 2 and 50 characters')
        .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
        .withMessage('Last name can only contain letters and spaces'),

    body('email')
        .trim()
        .isEmail()
        .withMessage('Please provide a valid email address')
        .isLength({ min: 5, max: 100 })
        .withMessage('Email must be between 5 and 100 characters')
        .normalizeEmail(),

    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),

    body('phoneNumber')
        .trim()
        .isMobilePhone('any')
        .withMessage('Please provide a valid phone number'),

    body('address')
        .trim()
        .isLength({ min: 5, max: 200 })
        .withMessage('Address must be between 5 and 200 characters'),

    body('points')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Points must be a non-negative integer')
];

/**
 * Validation for updating a user
 */
export const updateUserValidation = [
    body('firstName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('First name must be between 2 and 50 characters')
        .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
        .withMessage('First name can only contain letters and spaces'),

    body('lastName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Last name must be between 2 and 50 characters')
        .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
        .withMessage('Last name can only contain letters and spaces'),

    body('email')
        .optional()
        .trim()
        .isEmail()
        .withMessage('Please provide a valid email address')
        .isLength({ min: 5, max: 100 })
        .withMessage('Email must be between 5 and 100 characters')
        .normalizeEmail(),

    body('phoneNumber')
        .optional()
        .trim()
        .isMobilePhone('any')
        .withMessage('Please provide a valid phone number'),

    body('address')
        .optional()
        .trim()
        .isLength({ min: 5, max: 200 })
        .withMessage('Address must be between 5 and 200 characters'),

    body('isActive')
        .optional()
        .isBoolean()
        .withMessage('isActive must be a boolean value')
];

/**
 * Validation for updating user points
 */
export const updateUserPointsValidation = [
    body('points')
        .isInt({ min: 1 })
        .withMessage('Points must be a positive integer'),

    body('operation')
        .isIn(['add', 'subtract', 'set'])
        .withMessage('Operation must be one of: add, subtract, set'),

    body('reason')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Reason cannot exceed 200 characters')
];

/**
 * Validation for cancelling an appointment
 */
export const cancelAppointmentValidation = [
    body('reason')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Cancellation reason cannot exceed 200 characters')
];