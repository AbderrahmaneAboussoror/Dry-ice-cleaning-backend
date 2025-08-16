// webhooks/stripeWebhook.ts - Fixed export

import { Request, Response } from 'express';
import Stripe from 'stripe';
import { StripeService } from '../services/stripeService';
import Purchase from '../models/Purchase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-05-28.basil'
});

export const handleStripeWebhook = async (req: Request, res: Response): Promise<void> => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !endpointSecret) {
        console.error('Missing stripe signature or webhook secret');
        res.status(400).send('Missing required headers or configuration');
        return;
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message);
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }

    console.log(`📧 Received webhook: ${event.type} - ${event.id}`);

    try {
        // Handle the event
        switch (event.type) {
            case 'payment_intent.succeeded':
                const paymentIntent = event.data.object as Stripe.PaymentIntent;
                console.log('💳 Payment succeeded:', paymentIntent.id);

                try {
                    // Use the simplified approach without transactions
                    await StripeService.handleSuccessfulPayment(paymentIntent.id);
                    console.log('✅ Payment processed successfully via webhook');
                } catch (error) {
                    console.error('❌ Failed to process successful payment:', error);

                    // Don't throw here - we want to acknowledge the webhook
                    // but log this for manual investigation
                    console.error(`🚨 PAYMENT PROCESSING FAILED for ${paymentIntent.id}:`, error);
                }
                break;

            case 'payment_intent.payment_failed':
                const failedPayment = event.data.object as Stripe.PaymentIntent;
                console.log('❌ Payment failed:', failedPayment.id);

                try {
                    await Purchase.findOneAndUpdate(
                        { stripePaymentIntentId: failedPayment.id },
                        {
                            status: 'failed',
                            stripeMetadata: {
                                ...failedPayment.metadata,
                                failureReason: failedPayment.last_payment_error?.message || 'Unknown failure'
                            }
                        }
                    );
                    console.log('✅ Purchase marked as failed');
                } catch (error) {
                    console.error('Failed to update purchase status:', error);
                }
                break;

            case 'payment_intent.canceled':
                const canceledPayment = event.data.object as Stripe.PaymentIntent;
                console.log('🚫 Payment canceled:', canceledPayment.id);

                try {
                    await Purchase.findOneAndUpdate(
                        { stripePaymentIntentId: canceledPayment.id },
                        { status: 'canceled' }
                    );
                } catch (error) {
                    console.error('Failed to update canceled purchase:', error);
                }
                break;

            case 'payment_intent.requires_action':
                const actionRequired = event.data.object as Stripe.PaymentIntent;
                console.log('⚠️ Payment requires action:', actionRequired.id);
                // This is normal for 3D Secure payments, just log it
                break;

            default:
                console.log(`🤷 Unhandled event type: ${event.type}`);
        }

        // Always acknowledge receipt of webhook
        res.json({
            received: true,
            eventType: event.type,
            eventId: event.id
        });

    } catch (error) {
        console.error(`💥 Error processing webhook ${event.type}:`, error);

        // Return 200 to avoid infinite retries for non-critical errors
        res.status(200).json({
            received: true,
            error: 'Internal server error processing webhook',
            eventType: event.type,
            eventId: event.id
        });
    }
};