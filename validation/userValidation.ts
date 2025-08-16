import { body } from 'express-validator';

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

export const changePasswordValidation = [
    body('currentPassword')
        .notEmpty()
        .withMessage('Current password is required'),

    body('newPassword')
        .isLength({ min: 6 })
        .withMessage('New password must be at least 6 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number')
        .custom((value, { req }) => {
            if (value === req.body.currentPassword) {
                throw new Error('New password must be different from current password');
            }
            return true;
        })
];

export const changeEmailValidation = [
    body('newEmail')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),

    body('password')
        .notEmpty()
        .withMessage('Password is required to change email')
];

export const deleteAccountValidation = [
    body('password')
        .notEmpty()
        .withMessage('Password is required to delete account')
];

export const updatePointsValidation = [
    body('points')
        .isInt({ min: 1 })
        .withMessage('Points must be a positive integer'),

    body('operation')
        .isIn(['add', 'subtract', 'set'])
        .withMessage('Operation must be "add", "subtract", or "set"'),

    body('reason')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Reason cannot exceed 200 characters')
];