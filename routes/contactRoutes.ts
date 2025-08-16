// backend/routes/contactRoutes.ts
import express from 'express';
import { submitContactForm } from '../controllers/contactController';
import { contactFormValidation } from '../validation/contactValidation';

const router = express.Router();

/**
 * @swagger
 * /contact/submit:
 *   post:
 *     summary: Submit contact form
 *     description: Submit a contact form message that will be sent to the company email
 *     tags: [Contact]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - message
 *             properties:
 *               firstName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 example: "John"
 *                 description: "First name (letters and spaces only)"
 *               lastName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 example: "Doe"
 *                 description: "Last name (letters and spaces only)"
 *               email:
 *                 type: string
 *                 format: email
 *                 maxLength: 100
 *                 example: "john.doe@example.com"
 *                 description: "Valid email address"
 *               message:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 1000
 *                 example: "I'm interested in your dry ice cleaning services. Could you please provide more information about pricing for commercial properties?"
 *                 description: "Message content"
 *     responses:
 *       200:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Thank you for your message! We will get back to you soon."
 *       400:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Validation failed"
 *                 details:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       msg:
 *                         type: string
 *                       param:
 *                         type: string
 *                       location:
 *                         type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Failed to send message. Please try again later."
 */
router.post('/submit', contactFormValidation, submitContactForm);

export default router;