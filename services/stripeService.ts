// services/stripeService.ts - Fixed version without transactions

import Stripe from 'stripe';
import Pack from '../models/Pack';
import Purchase from '../models/Purchase';
import User from '../models/User';
import { Types } from 'mongoose';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-05-28.basil'
});

export class StripeService {

    static async createPaymentIntent(
        userId: string,
        packId: string,
        clientInfo: { email: string, name: string }
    ) {
        // Get pack details
        const pack = await Pack.findById(packId);
        if (!pack || !pack.isActive) {
            throw new Error('Pack not found or inactive');
        }

        // Convert DKK to øre (smallest currency unit)
        const amountInOre = pack.priceInDKK * 100;

        // Create Stripe PaymentIntent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInOre,
            currency: 'dkk',
            metadata: {
                userId,
                packId: (pack._id as Types.ObjectId).toString(),
                packName: pack.name,
                pointsIncluded: pack.pointsIncluded.toString(),
                bonusPoints: pack.bonusPoints.toString(),
                freeServices: JSON.stringify(pack.freeServices)
            },
            description: `${pack.name} - ${pack.totalPoints} points`,
            receipt_email: clientInfo.email,
            shipping: {
                name: clientInfo.name,
                address: {
                    country: 'DK'
                }
            }
        });

        // Create purchase record
        const purchase = new Purchase({
            userId: new Types.ObjectId(userId),
            packId: new Types.ObjectId(packId),
            stripePaymentIntentId: paymentIntent.id,
            stripeClientSecret: paymentIntent.client_secret,
            amount: amountInOre,
            currency: 'dkk',
            status: 'pending',
            stripeMetadata: paymentIntent.metadata
        });

        await purchase.save();

        return {
            paymentIntent,
            purchase,
            pack
        };
    }

    static async handleSuccessfulPayment(paymentIntentId: string) {
        try {
            console.log('🔍 HANDLE SUCCESSFUL PAYMENT (NO TRANSACTIONS):');
            console.log('Payment Intent ID:', paymentIntentId);

            // Find the purchase record
            const purchase = await Purchase.findOne({
                stripePaymentIntentId: paymentIntentId
            }).populate('packId userId');

            console.log('📦 Purchase found:', purchase?.toObject());

            if (!purchase) {
                console.error('❌ Purchase not found for payment intent:', paymentIntentId);
                return null;
            }

            // Check if already processed (idempotency)
            if (purchase.status === 'succeeded') {
                console.log('✅ Payment already processed:', paymentIntentId);
                return {
                    purchase,
                    user: purchase.userId as any,
                    pack: purchase.packId as any,
                    pointsAwarded: purchase.pointsAwarded + purchase.bonusPointsAwarded,
                    alreadyProcessed: true
                };
            }

            // Set status to processing to prevent duplicate processing
            purchase.status = 'processing';
            await purchase.save();

            const pack = purchase.packId as any;
            const user = purchase.userId as any;

            console.log('📋 Pack data:', pack?.toObject());
            console.log('👤 User data before:', user?.toObject());

            const pointsToAward = pack.pointsIncluded || 0;
            const bonusPointsToAward = pack.bonusPoints || 0;
            const totalPointsToAward = pointsToAward + bonusPointsToAward;

            console.log('🎯 Points calculation:');
            console.log('- Base points:', pointsToAward);
            console.log('- Bonus points:', bonusPointsToAward);
            console.log('- Total points:', totalPointsToAward);

            if (totalPointsToAward === 0) {
                console.error('🚨 CRITICAL: Total points to award is 0! Check pack data');
                console.error('Pack fields:', Object.keys(pack || {}));
            }

            // Update user points (without transaction)
            const updatedUser = await User.findByIdAndUpdate(
                user._id,
                { $inc: { totalPoints: totalPointsToAward } },
                { new: true }
            );

            console.log('👤 User data after update:', updatedUser?.toObject());

            if (!updatedUser) {
                // Rollback purchase status if user update fails
                purchase.status = 'failed';
                await purchase.save();
                throw new Error('Failed to update user points');
            }

            // Update purchase record to succeeded
            purchase.status = 'succeeded';
            purchase.pointsAwarded = pointsToAward;
            purchase.bonusPointsAwarded = bonusPointsToAward;
            purchase.serviceCreditsAwarded = pack.freeServices || [];

            await purchase.save();

            console.log('📦 Purchase updated:', purchase.toObject());
            console.log(`🎉 User ${user.email} purchased ${pack.name} and received ${totalPointsToAward} points`);

            return {
                purchase,
                user: updatedUser,
                pack,
                pointsAwarded: totalPointsToAward,
                alreadyProcessed: false
            };
        } catch (error) {
            console.error('💥 Error handling successful payment:', error);

            // Try to mark purchase as failed if possible
            try {
                await Purchase.findOneAndUpdate(
                    { stripePaymentIntentId: paymentIntentId },
                    { status: 'failed' }
                );
            } catch (rollbackError) {
                console.error('Failed to rollback purchase status:', rollbackError);
            }

            throw error;
        }
    }

    static async getPaymentIntent(paymentIntentId: string) {
        return await stripe.paymentIntents.retrieve(paymentIntentId);
    }

    static async cancelPaymentIntent(paymentIntentId: string) {
        const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId);

        // Update purchase record
        await Purchase.findOneAndUpdate(
            { stripePaymentIntentId: paymentIntentId },
            { status: 'canceled' }
        );

        return paymentIntent;
    }

    // Remove the retry mechanism with transactions
    static async processWebhookWithRetry(paymentIntentId: string, maxRetries = 3) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const result = await this.handleSuccessfulPayment(paymentIntentId);
                if (result) return result;

                // If result is null (already processed), that's also success
                return null;
            } catch (error) {
                console.error(`Attempt ${attempt} failed:`, error);

                if (attempt === maxRetries) {
                    console.error(`Failed to process payment after ${maxRetries} attempts:`, paymentIntentId);
                    throw error;
                }

                // Wait before retry (without exponential backoff for simplicity)
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
        }
    }
}