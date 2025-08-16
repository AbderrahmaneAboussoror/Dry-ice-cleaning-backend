import { body } from 'express-validator';
import { Types } from 'mongoose';

export const initiatePurchaseValidation = [
    body('packId')
        .notEmpty()
        .withMessage('Pack ID is required')
        .custom((value) => {
            if (!Types.ObjectId.isValid(value)) {
                throw new Error('Invalid pack ID format');
            }
            return true;
        })
];

export const confirmPurchaseValidation = [
    body('paymentIntentId')
        .notEmpty()
        .withMessage('Payment intent ID is required')
        .isString()
        .withMessage('Payment intent ID must be a string')
];