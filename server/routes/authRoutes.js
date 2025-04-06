import express from 'express';
import { registerUser, registerAdmin, login, getProfile } from '../controllers/authController.js';
import { verifyToken, requireAdmin } from '../middleware/authMiddleware.js';

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication and account management
 */

const authRouter = express.Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new store manager
 *     tags: [Authentication]
 */
authRouter.post('/auth/register', registerUser);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Authenticate a user
 *     tags: [Authentication]
 */
authRouter.post('/auth/login', login);

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 */
authRouter.get('/auth/profile', verifyToken, getProfile);

/**
 * @swagger
 * /api/admin/register:
 *   post:
 *     summary: Register a new system administrator
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 */
authRouter.post('/admin/register', verifyToken, requireAdmin, registerAdmin);

/**
 * @swagger
 * /api/admin/initial-setup:
 *   post:
 *     summary: Initial admin setup for a new installation
 *     tags: [Authentication]
 */
authRouter.post('/admin/initial-setup', registerAdmin);

export default authRouter;