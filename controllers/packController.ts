import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import Pack from '../models/Pack';
import Purchase from '../models/Purchase';
import { StripeService } from '../services/stripeService';
import User from "../models/User";

interface AuthRequest extends Request {
    user?: any;
}

export const getAvailablePacks = async (req: Request, res: Response): Promise<void> => {
    try {
        const packs = await Pack.find({ isActive: true }).sort({ priceInDKK: 1 });

        const packsWithDetails = packs.map(pack => ({
            id: pack._id,
            name: pack.name,
            description: pack.description,
            priceInDKK: pack.priceInDKK,
            pointsIncluded: pack.pointsIncluded,
            bonusPoints: pack.bonusPoints,
            totalPoints: pack.totalPoints,
            freeServices: pack.freeServices,
            totalValue: pack.totalValue,
            savings: pack.totalValue - pack.priceInDKK
        }));

        res.json({
            packs: packsWithDetails
        });
    } catch (error) {
        console.error('Get packs error:', error);
        res.status(500).json({ error: 'Failed to get available packs' });
    }
};

export const initiatePurchase = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
            return;
        }

        const { packId } = req.body;
        const userId = req.user._id.toString();
        const user = req.user;

        // Create Stripe PaymentIntent
        const result = await StripeService.createPaymentIntent(
            userId,
            packId,
            {
                email: user.email,
                name: `${user.firstName} ${user.lastName}`
            }
        );

        res.status(201).json({
            message: 'Payment initiated successfully',
            clientSecret: result.paymentIntent.client_secret,
            paymentIntentId: result.paymentIntent.id,
            pack: {
                id: result.pack._id,
                name: result.pack.name,
                priceInDKK: result.pack.priceInDKK,
                totalPoints: result.pack.totalPoints,
                description: result.pack.description
            },
            purchase: {
                id: result.purchase._id,
                status: result.purchase.status,
                amount: result.purchase.amount / 100 // Convert back to DKK
            }
        });

    } catch (error: any) {
        console.error('Initiate purchase error:', error);
        res.status(500).json({
            error: 'Failed to initiate purchase',
            details: error.message
        });
    }
};

export const confirmPurchase = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
            return;
        }

        const { paymentIntentId } = req.body;
        const userId = req.user._id.toString();

        console.log('🔍 CONFIRM PURCHASE DEBUG:');
        console.log('Payment Intent ID:', paymentIntentId);
        console.log('User ID:', userId);

        // Find the purchase
        const purchase = await Purchase.findOne({
            stripePaymentIntentId: paymentIntentId,
            userId: userId
        });

        if (!purchase) {
            console.log('❌ Purchase not found');
            res.status(404).json({
                error: 'Purchase not found',
                code: 'PURCHASE_NOT_FOUND'
            });
            return;
        }

        // If already succeeded, return success response
        if (purchase.status === 'succeeded') {
            console.log('✅ Purchase already succeeded');
            const user = await User.findById(userId);

            res.json({
                message: 'Purchase already completed',
                pointsAwarded: purchase.pointsAwarded + purchase.bonusPointsAwarded,
                purchase: {
                    id: purchase._id,
                    status: purchase.status,
                    pointsAwarded: purchase.pointsAwarded,
                    bonusPointsAwarded: purchase.bonusPointsAwarded,
                    serviceCreditsAwarded: purchase.serviceCreditsAwarded
                },
                userNewBalance: user?.totalPoints || 0
            });
            return;
        }

        // If currently processing, ask client to wait
        if (purchase.status === 'processing') {
            console.log('⏳ Purchase is being processed');
            res.status(202).json({
                message: 'Purchase is being processed, please wait',
                status: 'processing'
            });
            return;
        }

        // Check Stripe payment status
        console.log('🔍 Checking Stripe payment status...');

        let paymentIntent;
        try {
            paymentIntent = await StripeService.getPaymentIntent(paymentIntentId);
        } catch (stripeError: any) {
            console.error('Stripe API error:', stripeError);
            res.status(500).json({
                error: 'Failed to verify payment status',
                code: 'STRIPE_API_ERROR'
            });
            return;
        }

        console.log('💳 Stripe payment status:', paymentIntent.status);

        if (paymentIntent.status === 'succeeded') {
            console.log('✅ Processing successful payment...');

            try {
                const result = await StripeService.handleSuccessfulPayment(paymentIntentId);

                if (result) {
                    const { purchase: updatedPurchase, user: updatedUser, pointsAwarded, alreadyProcessed } = result;

                    res.json({
                        message: alreadyProcessed ? 'Purchase already completed' : 'Purchase completed successfully',
                        pointsAwarded,
                        purchase: {
                            id: updatedPurchase._id,
                            status: updatedPurchase.status,
                            pointsAwarded: updatedPurchase.pointsAwarded,
                            bonusPointsAwarded: updatedPurchase.bonusPointsAwarded,
                            serviceCreditsAwarded: updatedPurchase.serviceCreditsAwarded
                        },
                        userNewBalance: updatedUser.totalPoints
                    });
                } else {
                    console.log('❌ Payment processing returned null');
                    res.status(400).json({
                        error: 'Purchase processing failed',
                        code: 'PROCESSING_FAILED'
                    });
                }
            } catch (processingError: any) {
                console.error('Payment processing error:', processingError);
                res.status(500).json({
                    error: 'Failed to process successful payment',
                    code: 'PROCESSING_ERROR',
                    details: processingError.message
                });
            }
        } else if (paymentIntent.status === 'requires_payment_method') {
            res.status(400).json({
                error: 'Payment requires a new payment method',
                paymentStatus: paymentIntent.status,
                code: 'PAYMENT_REQUIRES_ACTION'
            });
        } else if (paymentIntent.status === 'canceled') {
            res.status(400).json({
                error: 'Payment was canceled',
                paymentStatus: paymentIntent.status,
                code: 'PAYMENT_CANCELED'
            });
        } else {
            console.log('❌ Payment not completed on Stripe');
            res.status(400).json({
                error: 'Payment not completed',
                paymentStatus: paymentIntent.status,
                code: 'PAYMENT_INCOMPLETE'
            });
        }

    } catch (error: any) {
        console.error('💥 Confirm purchase error:', error);
        res.status(500).json({
            error: 'Failed to confirm purchase',
            code: 'INTERNAL_ERROR',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

export const getUserPurchases = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user._id;

        const purchases = await Purchase.find({
            userId,
            status: 'succeeded',
            $or: [
                { pointsAwarded: { $gt: 0 } },
                { bonusPointsAwarded: { $gt: 0 } }
            ]
        })
            .populate('packId')
            .sort({ createdAt: -1 })
            .limit(50);

        const purchasesWithDetails = purchases.map(purchase => ({
            id: purchase._id,
            pack: purchase.packId,
            amount: purchase.amount / 100, // Convert to DKK
            status: purchase.status,
            pointsAwarded: purchase.pointsAwarded,
            bonusPointsAwarded: purchase.bonusPointsAwarded,
            serviceCreditsAwarded: purchase.serviceCreditsAwarded,
            createdAt: purchase.createdAt
        }));

        res.json({
            purchases: purchasesWithDetails
        });

    } catch (error) {
        console.error('Get user purchases error:', error);
        res.status(500).json({ error: 'Failed to get purchase history' });
    }
};