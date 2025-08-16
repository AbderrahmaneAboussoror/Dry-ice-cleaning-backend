import express from 'express';
import { handleStripeWebhook } from '../webhooks/stripeWebhook';

const router = express.Router();

/**
 * @swagger
 * /webhooks/stripe:
 *   post:
 *     summary: Stripe webhook endpoint
 *     tags: [Webhooks]
 *     description: Internal endpoint for Stripe webhook events
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       400:
 *         description: Webhook validation failed
 */
router.post('/stripe', express.raw({ type: 'application/json' }), handleStripeWebhook);

export default router;