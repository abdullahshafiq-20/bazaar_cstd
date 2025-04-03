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

const stockRouter = express.Router();

// Protected routes - require authentication
stockRouter.use(verifyToken);

// Store-specific routes accessible to authorized users
stockRouter.post('/stores/:id/stock/add', addStock);
stockRouter.post('/stores/:id/stock/sale', recordSale);
stockRouter.post('/stores/:id/stock/remove', manualRemoval);
stockRouter.get('/stores/:id/stock/movements', getStoreStockMovements);
stockRouter.get('/stores/:id/inventory', getStoreInventory);
stockRouter.get('/stores/:id/inventory-value', getStoreInventoryValue);

// Routes for transferring stock between stores
stockRouter.post('/transfers', transferStock);

// Admin-only routes with date range filtering
stockRouter.get('/reports/stock', requireAdmin, dateRangeFilter, getStockReport);
stockRouter.get('/reports/system-stock', requireAdmin, dateRangeFilter, getAllStoresStockReport);

export default stockRouter;