import express from 'express';
import { 
  getAllStores, 
  getStoreById, 
  createStore, 
  updateStore, 
  deleteStore, 
  toggleStoreStatus,
  getStoreManagers,
  getStoreFullDetails,
  getAllStoresFullDetails
} from '../controllers/storeController.js';
import { verifyToken, requireAdmin } from '../middleware/authMiddleware.js';
import dateRangeFilter from '../middleware/dateRangeFilter.js';

/**
 * @swagger
 * tags:
 *   name: Stores
 *   description: Store management and reporting
 */

const storeRouter = express.Router();

// Protected routes - require authentication
storeRouter.use(verifyToken);

/**
 * @swagger
 * /api/stores:
 *   get:
 *     summary: Get all stores
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 */
storeRouter.get('/stores', getAllStores);

/**
 * @swagger
 * /api/stores/{id}:
 *   get:
 *     summary: Get store by ID
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 */
storeRouter.get('/stores/:id', getStoreById);

/**
 * @swagger
 * /api/stores:
 *   post:
 *     summary: Create a new store
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 */
storeRouter.post('/stores', requireAdmin, createStore);

/**
 * @swagger
 * /api/stores/{id}:
 *   put:
 *     summary: Update a store
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 */
storeRouter.put('/stores/:id', requireAdmin, updateStore);

/**
 * @swagger
 * /api/stores/{id}:
 *   delete:
 *     summary: Delete a store
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 */
storeRouter.delete('/stores/:id', requireAdmin, deleteStore);

/**
 * @swagger
 * /api/stores/{id}/status:
 *   patch:
 *     summary: Change store status
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 */
storeRouter.patch('/stores/:id/status', requireAdmin, toggleStoreStatus);

/**
 * @swagger
 * /api/stores/{id}/managers:
 *   get:
 *     summary: Get store managers
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 */
storeRouter.get('/stores/:id/managers', requireAdmin, getStoreManagers);

/**
 * @swagger
 * /api/stores/{id}/full-details:
 *   get:
 *     summary: Get detailed store report
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 */
storeRouter.get('/stores/:id/full-details', requireAdmin, dateRangeFilter, getStoreFullDetails);

/**
 * @swagger
 * /api/stores/reports/all:
 *   get:
 *     summary: Get all stores report
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 */
storeRouter.get('/stores/reports/all', requireAdmin, dateRangeFilter, getAllStoresFullDetails);

export default storeRouter;