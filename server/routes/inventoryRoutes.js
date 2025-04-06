import express from "express";
import { 
  getCurrentInventory, 
  getProductInventory, 
  addProductToInventory,
  removeFromInventory,
  getInventoryAlerts,
  getInventoryValue
} from '../controllers/inventoryController.js';
import { verifyToken, requireStoreManager } from '../middleware/authMiddleware.js';

/**
 * @swagger
 * tags:
 *   name: Inventory
 *   description: Store inventory management
 */

const inventoryRouter = express.Router();

// Apply authentication to all routes
inventoryRouter.use(verifyToken);

/**
 * @swagger
 * /api/stores/{id}/inventory:
 *   get:
 *     summary: Get current inventory for a store
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 */
inventoryRouter.get('/stores/:id/inventory', requireStoreManager, getCurrentInventory);

/**
 * @swagger
 * /api/stores/{id}/inventory/product/{productId}:
 *   get:
 *     summary: Get inventory details for a specific product
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 */
inventoryRouter.get('/stores/:id/inventory/product/:productId', requireStoreManager, getProductInventory);

/**
 * @swagger
 * /api/stores/{id}/inventory/add:
 *   post:
 *     summary: Add product to inventory
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 */
inventoryRouter.post('/stores/:id/inventory/add', requireStoreManager, addProductToInventory);

/**
 * @swagger
 * /api/stores/{id}/inventory/remove:
 *   post:
 *     summary: Remove product from inventory
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 */
inventoryRouter.post('/stores/:id/inventory/remove', requireStoreManager, removeFromInventory);

/**
 * @swagger
 * /api/stores/{id}/inventory/alerts:
 *   get:
 *     summary: Get inventory alerts
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 */
inventoryRouter.get('/stores/:id/inventory/alerts', requireStoreManager, getInventoryAlerts);

/**
 * @swagger
 * /api/stores/{id}/inventory/value:
 *   get:
 *     summary: Get inventory value
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 */
inventoryRouter.get('/stores/:id/inventory/value', requireStoreManager, getInventoryValue);

export default inventoryRouter;