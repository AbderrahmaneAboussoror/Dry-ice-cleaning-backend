import { body } from 'express-validator';

export const registerValidation = [
    body('firstName')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('First name must be between 2 and 50 characters'),

    body('lastName')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Last name must be between 2 and 50 characters'),

    body('email')
        .isEmail()
        .toLowerCase()
        .withMessage('Please provide a valid email address'),

    body('phoneNumber')
        .trim()
        .isMobilePhone('any')
        .withMessage('Please provide a valid phone number'),

    // body('password')
    //     .isLength({ min: 6 })
    //     .withMessage('Password must be at least 6 characters long')
    //     .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    //     .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),

    body('address')
        .trim()
        .isLength({ min: 5, max: 200 })
        .withMessage('Address must be between 5 and 200 characters')
];

export const loginValidation = [
    body('email')
        .isEmail()
        .toLowerCase()
        .withMessage('Please provide a valid email address'),

    body('password')
        .notEmpty()
        .withMessage('Password is required')
];

export const updateProfileValidation = [
    body('firstName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('First name must be between 2 and 50 characters'),

    body('lastName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Last name must be between 2 and 50 characters'),

    body('phoneNumber')
        .optional()
        .trim()
        .isMobilePhone('any')
        .withMessage('Please provide a valid phone number'),

    body('address')
        .optional()
        .trim()
        .isLength({ min: 5, max: 200 })
        .withMessage('Address must be between 5 and 200 characters')
];