import express from 'express';
import {
    getAvailablePacks,
    initiatePurchase,
    confirmPurchase,
    getUserPurchases
} from '../controllers/packController';
import { authenticate } from '../middlewares/auth';
import {
    initiatePurchaseValidation,
    confirmPurchaseValidation
} from '../validation/packValidation';

const router = express.Router();

/**
 * @swagger
 * /packs:
 *   get:
 *     summary: Get available point packs
 *     tags: [Packs]
 *     responses:
 *       200:
 *         description: List of available packs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 packs:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       priceInDKK:
 *                         type: number
 *                       pointsIncluded:
 *                         type: number
 *                       bonusPoints:
 *                         type: number
 *                       totalPoints:
 *                         type: number
 *                       freeServices:
 *                         type: array
 *                       totalValue:
 *                         type: number
 *                       savings:
 *                         type: number
 */
router.get('/', getAvailablePacks);

/**
 * @swagger
 * /packs/purchase:
 *   post:
 *     summary: Initiate pack purchase
 *     tags: [Packs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - packId
 *             properties:
 *               packId:
 *                 type: string
 *                 example: "648f2e3a1234567890abcdef"
 *     responses:
 *       201:
 *         description: Purchase initiated successfully
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Unauthorized
 */
router.post('/purchase', authenticate, initiatePurchaseValidation, initiatePurchase);

/**
 * @swagger
 * /packs/confirm:
 *   post:
 *     summary: Confirm pack purchase
 *     tags: [Packs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentIntentId
 *             properties:
 *               paymentIntentId:
 *                 type: string
 *                 example: "pi_1234567890abcdef"
 *     responses:
 *       200:
 *         description: Purchase confirmed successfully
 *       400:
 *         description: Payment not completed or validation failed
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Purchase not found
 */
router.post('/confirm', authenticate, confirmPurchaseValidation, confirmPurchase);

/**
 * @swagger
 * /packs/purchases:
 *   get:
 *     summary: Get user's purchase history
 *     tags: [Packs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Purchase history retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/purchases', authenticate, getUserPurchases);

export default router;