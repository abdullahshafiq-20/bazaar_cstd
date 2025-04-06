import express from 'express';
import { 
    addStock, 
    recordSale, 
    manualRemoval, 
    getStoreStockMovements, 
    getStoreInventory,
    getStoreInventoryValue,
    transferStock,
    getStockReport,
    getAllStoresStockReport
} from '../controllers/stockController.js';
import { verifyToken, requireAdmin } from '../middleware/authMiddleware.js';
import dateRangeFilter from '../middlewares/dateRangeFilter.js';

/**
 * @swagger
 * tags:
 *   name: Stock
 *   description: Stock management and inventory control
 */

const stockRouter = express.Router();

// Protected routes - require authentication
stockRouter.use(verifyToken);

/**
 * @swagger
 * /api/stores/{id}/stock/add:
 *   post:
 *     summary: Add stock to a store
 *     description: Add quantity of a product to a specific store's inventory
 *     tags: [Stock]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Store ID
 */
stockRouter.post('/stores/:id/stock/add', addStock);

/**
 * @swagger
 * /api/stores/{id}/stock/sale:
 *   post:
 *     summary: Record a sale
 *     description: Record a product sale from a specific store
 *     tags: [Stock]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Store ID
 */
stockRouter.post('/stores/:id/stock/sale', recordSale);

/**
 * @swagger
 * /api/stores/{id}/stock/remove:
 *   post:
 *     summary: Manual stock removal
 *     description: Manually remove stock from a store (not sales)
 *     tags: [Stock]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Store ID
 */
stockRouter.post('/stores/:id/stock/remove', manualRemoval);

/**
 * @swagger
 * /api/stores/{id}/stock/movements:
 *   get:
 *     summary: Get store stock movements
 *     description: Get stock movement history for a specific store with optional filtering
 *     tags: [Stock]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Store ID
 */
stockRouter.get('/stores/:id/stock/movements', getStoreStockMovements);

/**
 * @swagger
 * /api/stores/{id}/inventory:
 *   get:
 *     summary: Get store inventory
 *     description: Get current inventory levels for a specific store
 *     tags: [Stock]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Store ID
 */
stockRouter.get('/stores/:id/inventory', getStoreInventory);

/**
 * @swagger
 * /api/stores/{id}/inventory-value:
 *   get:
 *     summary: Get store inventory value
 *     description: Get the total value of inventory in a store, broken down by category
 *     tags: [Stock]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Store ID
 */
stockRouter.get('/stores/:id/inventory-value', getStoreInventoryValue);

/**
 * @swagger
 * /api/transfers:
 *   post:
 *     summary: Transfer stock between stores
 *     description: Move stock of a product from one store to another
 *     tags: [Stock]
 *     security:
 *       - bearerAuth: []
 */
stockRouter.post('/transfers', transferStock);

/**
 * @swagger
 * /api/reports/stock:
 *   get:
 *     summary: Get stock movement report
 *     description: Get detailed stock movement report with optional date filtering
 *     tags: [Stock]
 *     security:
 *       - bearerAuth: []
 */
stockRouter.get('/reports/stock', requireAdmin, dateRangeFilter, getStockReport);

/**
 * @swagger
 * /api/reports/system-stock:
 *   get:
 *     summary: Get system-wide stock report
 *     description: Get comprehensive stock report across all stores with summary data
 *     tags: [Stock]
 *     security:
 *       - bearerAuth: []
 */
stockRouter.get('/reports/system-stock', requireAdmin, dateRangeFilter, getAllStoresStockReport);

export default stockRouter;