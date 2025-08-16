import express from 'express';
import {
    getAllUsers,
    createUser,
    updateUser,
    deleteUser,
    updateUserPoints,
    getUpcomingAppointments,
    cancelAppointment
} from '../controllers/adminController';
import { authenticate, isAdmin } from '../middlewares/auth';
import {
    createUserValidation,
    updateUserValidation,
    updateUserPointsValidation,
    cancelAppointmentValidation
} from '../validation/adminValidation';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(isAdmin);

// ========== USER MANAGEMENT ==========

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Get all registered users
 *     description: Retrieve all users with pagination and filtering options
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of users per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       firstName:
 *                         type: string
 *                       lastName:
 *                         type: string
 *                       email:
 *                         type: string
 *                       phoneNumber:
 *                         type: string
 *                       points:
 *                         type: number
 *                       isActive:
 *                         type: boolean
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.get('/users', getAllUsers);

/**
 * @swagger
 * /admin/users:
 *   post:
 *     summary: Create new user account
 *     description: Admin can create new user accounts
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
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
 *               - password
 *               - phoneNumber
 *             properties:
 *               firstName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 example: "John"
 *               lastName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 example: "Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john.doe@example.com"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "securepassword123"
 *               phoneNumber:
 *                 type: string
 *                 example: "+45 12 34 56 78"
 *               address:
 *                 type: string
 *                 example: "123 Main St, Copenhagen"
 *               points:
 *                 type: number
 *                 minimum: 0
 *                 default: 0
 *                 example: 1000
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       409:
 *         description: Email already exists
 */
router.post('/users', createUserValidation, createUser);

/**
 * @swagger
 * /admin/users/{id}:
 *   put:
 *     summary: Update user account
 *     description: Admin can update any user account details
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *               lastName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *               email:
 *                 type: string
 *                 format: email
 *               phoneNumber:
 *                 type: string
 *               address:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: User not found
 *       409:
 *         description: Email already exists
 */
router.put('/users/:id', updateUserValidation, updateUser);

/**
 * @swagger
 * /admin/users/{id}:
 *   delete:
 *     summary: Delete user account
 *     description: Admin can delete user accounts (soft delete)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: User not found
 */
router.delete('/users/:id', deleteUser);

/**
 * @swagger
 * /admin/users/{id}/points:
 *   put:
 *     summary: Update user points
 *     description: Admin can add, subtract, or set user points
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - points
 *               - operation
 *             properties:
 *               points:
 *                 type: integer
 *                 minimum: 1
 *                 example: 500
 *               operation:
 *                 type: string
 *                 enum: [add, subtract, set]
 *                 example: "add"
 *               reason:
 *                 type: string
 *                 maxLength: 200
 *                 example: "Admin adjustment - customer service credit"
 *     responses:
 *       200:
 *         description: Points updated successfully
 *       400:
 *         description: Validation failed or insufficient points
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: User not found
 */
router.put('/users/:id/points', updateUserPointsValidation, updateUserPoints);

// ========== APPOINTMENT MANAGEMENT ==========

/**
 * @swagger
 * /admin/appointments:
 *   get:
 *     summary: Get upcoming appointments
 *     description: View all upcoming appointments with optional week filter
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: week
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Filter to current week only
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, in_progress, completed, cancelled]
 *         description: Filter by appointment status
 *       - in: query
 *         name: serviceType
 *         schema:
 *           type: string
 *           enum: [basic, deluxe]
 *         description: Filter by service type
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by specific date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Appointments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       userId:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           firstName:
 *                             type: string
 *                           lastName:
 *                             type: string
 *                           email:
 *                             type: string
 *                           phoneNumber:
 *                             type: string
 *                       serviceType:
 *                         type: string
 *                         enum: [basic, deluxe]
 *                       appointmentDate:
 *                         type: string
 *                         format: date
 *                       timeSlot:
 *                         type: string
 *                       location:
 *                         type: string
 *                       status:
 *                         type: string
 *                       price:
 *                         type: number
 *                       notes:
 *                         type: string
 *                 count:
 *                   type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.get('/appointments', getUpcomingAppointments);

/**
 * @swagger
 * /admin/appointments/{id}/cancel:
 *   put:
 *     summary: Cancel an appointment
 *     description: Admin can cancel any appointment
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Appointment ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 maxLength: 200
 *                 example: "Customer requested cancellation"
 *     responses:
 *       200:
 *         description: Appointment cancelled successfully
 *       400:
 *         description: Appointment cannot be cancelled
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Appointment not found
 */
router.put('/appointments/:id/cancel', cancelAppointmentValidation, cancelAppointment);

export default router;