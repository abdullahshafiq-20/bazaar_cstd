import express from 'express';
import { 
  getAuditLogs, 
  getAuditLogById, 
  getEntityAuditHistory, 
  getAuditStatistics 
} from '../controllers/auditController.js';
import { verifyToken, requireAdmin } from '../middleware/authMiddleware.js';

/**
 * @swagger
 * tags:
 *   name: Audit
 *   description: Audit log management and reporting
 */

const auditRouter = express.Router();

// All audit routes require authentication and admin privileges
auditRouter.use(verifyToken);
auditRouter.use(requireAdmin);

/**
 * @swagger
 * /api/audit/logs:
 *   get:
 *     summary: Get audit logs
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 */
auditRouter.get('/audit/logs', getAuditLogs);

/**
 * @swagger
 * /api/audit/logs/{id}:
 *   get:
 *     summary: Get audit log by ID
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 */
auditRouter.get('/audit/logs/:id', getAuditLogById);

/**
 * @swagger
 * /api/audit/entity/{table}/{id}:
 *   get:
 *     summary: Get audit history for a specific entity
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 */
auditRouter.get('/audit/entity/:table/:id', getEntityAuditHistory);

/**
 * @swagger
 * /api/audit/statistics:
 *   get:
 *     summary: Get audit statistics
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 */
auditRouter.get('/audit/statistics', getAuditStatistics);

export default auditRouter;