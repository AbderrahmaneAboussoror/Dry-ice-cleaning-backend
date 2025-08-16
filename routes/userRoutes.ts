import express from 'express';
import {
    updateProfile,
    changePassword,
    changeEmail,
    deleteAccount,
    getUserProfile, updateUserPoints,
    getUserBookings, getUserPurchases
} from '../controllers/userController';
import { authenticate } from '../middlewares/auth';
import {
    updateProfileValidation,
    changePasswordValidation,
    changeEmailValidation,
    deleteAccountValidation, updatePointsValidation
} from '../validation/userValidation';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /user/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get('/profile', getUserProfile);

/**
 * @swagger
 * /user/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
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
 *                 minLength: 10
 *                 maxLength: 100
 *               phoneNumber:
 *                 type: string
 *               address:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 200
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.put('/profile', updateProfileValidation, updateProfile);

/**
 * @swagger
 * /user/change-password:
 *   put:
 *     summary: Change user password
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Validation failed or incorrect current password
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.put('/change-password', changePasswordValidation, changePassword);

/**
 * @swagger
 * /user/change-email:
 *   put:
 *     summary: Change user email
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newEmail
 *               - password
 *             properties:
 *               newEmail:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email changed successfully
 *       400:
 *         description: Validation failed or incorrect password
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       409:
 *         description: Email already in use
 */
router.put('/change-email', changeEmailValidation, changeEmail);

/**
 * @swagger
 * /user/delete-account:
 *   delete:
 *     summary: Delete user account (soft delete)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *       400:
 *         description: Validation failed or incorrect password
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.delete('/delete-account', deleteAccountValidation, deleteAccount);

/**
 * @swagger
 * /user/points:
 *   put:
 *     summary: Update user points
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
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
 *                 example: "Payment received"
 *     responses:
 *       200:
 *         description: Points updated successfully
 *       400:
 *         description: Validation failed or insufficient points
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.put('/points', updatePointsValidation, updateUserPoints);

/**
 * @swagger
 * /user/purchases:
 *   get:
 *     summary: Get user's purchase history
 *     description: Retrieve all pack purchases made by the authenticated user
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Purchase history retrieved successfully
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
 *                         example: "685712d493b1b37d7aa2f354"
 *                       userId:
 *                         type: string
 *                         example: "684f36b160aa49d119fdbe42"
 *                       packId:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                             example: "Standard Pack"
 *                           description:
 *                             type: string
 *                             example: "Great value with bonus points included"
 *                           freeServices:
 *                             type: array
 *                             items:
 *                               type: string
 *                       amount:
 *                         type: number
 *                         example: 280000
 *                       currency:
 *                         type: string
 *                         example: "dkk"
 *                       status:
 *                         type: string
 *                         enum: [pending, completed, failed]
 *                         example: "completed"
 *                       pointsAwarded:
 *                         type: number
 *                         example: 2800
 *                       bonusPointsAwarded:
 *                         type: number
 *                         example: 500
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/purchases', getUserPurchases);

/**
 * @swagger
 * /user/bookings:
 *   get:
 *     summary: Get user's appointment history
 *     description: Retrieve all completed appointments for the authenticated user
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Booking history retrieved successfully
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
 *                         example: "675712d493b1b37d7aa2f354"
 *                       userId:
 *                         type: string
 *                         example: "684f36b160aa49d119fdbe42"
 *                       serviceType:
 *                         type: string
 *                         enum: [basic, deluxe]
 *                         example: "basic"
 *                       appointmentDate:
 *                         type: string
 *                         format: date
 *                         example: "2025-06-20"
 *                       timeSlot:
 *                         type: string
 *                         example: "14:00-16:00"
 *                       startTime:
 *                         type: string
 *                         format: date-time
 *                       endTime:
 *                         type: string
 *                         format: date-time
 *                       location:
 *                         type: string
 *                         example: "123 Main St, Copenhagen"
 *                       status:
 *                         type: string
 *                         enum: [pending, confirmed, in_progress, completed, cancelled]
 *                         example: "completed"
 *                       price:
 *                         type: number
 *                         example: 500
 *                       notes:
 *                         type: string
 *                         example: "Customer requested early arrival"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                 count:
 *                   type: number
 *                   example: 5
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/bookings', getUserBookings);

export default router;