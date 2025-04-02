import express from 'express';
import { registerUser, registerAdmin, login, getProfile } from '../controllers/authController.js';
import { verifyToken, requireAdmin } from '../middleware/authMiddleware.js';

const authRouter = express.Router();

// Public routes
authRouter.post('/auth/register', registerUser);
authRouter.post('/auth/login', login);

// Protected routes
authRouter.get('/auth/profile', verifyToken, getProfile);

// Admin-only routes
authRouter.post('/admin/register', verifyToken, requireAdmin, registerAdmin);
// Temporary route for initial admin setup - REMOVE AFTER FIRST ADMIN IS CREATED
// authRouter.post('/admin/initial-setup', registerAdmin);

// Normal admin registration (protected)
// authRouter.post('/admin/register', verifyToken, requireAdmin, registerAdmin);

export default authRouter;