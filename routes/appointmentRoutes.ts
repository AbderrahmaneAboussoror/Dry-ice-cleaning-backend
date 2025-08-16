import express from 'express';
import { bookAppointment, getUserAppointments, cancelAppointment } from '../controllers/appointmentController';
import { authenticate } from '../middlewares/auth';
import { bookAppointmentValidation } from '../validation/appointmentValidation';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /appointments:
 *   post:
 *     summary: Book a new appointment
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - serviceType
 *               - appointmentDate
 *               - location
 *             properties:
 *               serviceType:
 *                 type: string
 *                 enum: [basic, deluxe]
 *               appointmentDate:
 *                 type: string
 *                 format: date
 *                 example: "2025-06-20"
 *               location:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 200
 *                 example: "123 Main Street, Copenhagen"
 *               notes:
 *                 type: string
 *                 maxLength: 500
 *                 example: "Please call when you arrive"
 *     responses:
 *       201:
 *         description: Appointment booked successfully
 *       400:
 *         description: Invalid request or no available slots
 *       401:
 *         description: Unauthorized
 */
router.post('/', bookAppointmentValidation, bookAppointment);

/**
 * @swagger
 * /appointments:
 *   get:
 *     summary: Get user's appointments
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user appointments
 *       401:
 *         description: Unauthorized
 */
router.get('/', getUserAppointments);

/**
 * @swagger
 * /appointments/{appointmentId}/cancel:
 *   put:
 *     summary: Cancel an appointment
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: appointmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Appointment cancelled successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Appointment not found
 */
router.put('/:appointmentId/cancel', cancelAppointment);

export default router;