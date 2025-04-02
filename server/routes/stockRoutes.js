import express from 'express';
import { 
    addStock, 
    recordSale, 
    manualRemoval, 
    getStoreStockMovements,
    getStoreInventory,
    getStoreInventoryValue,
    transferStock
} from '../controllers/stockController.js';
import { verifyToken, requireStoreManager, requireAdmin } from '../middleware/authMiddleware.js';

const stockRouter = express.Router();

// Apply authentication to all routes
stockRouter.use(verifyToken);

// Store-specific stock management (requires store manager permission)
stockRouter.post('/stores/:id/stock/add', requireStoreManager, addStock);
stockRouter.post('/stores/:id/stock/sale', requireStoreManager, recordSale);
stockRouter.post('/stores/:id/stock/remove', requireStoreManager, manualRemoval);
stockRouter.get('/stores/:id/stock/movements', requireStoreManager, getStoreStockMovements);
stockRouter.get('/stores/:id/stock/inventory', requireStoreManager, getStoreInventory);
stockRouter.get('/stores/:id/stock/value', requireStoreManager, getStoreInventoryValue);

// Stock transfer (requires admin permission)
stockRouter.post('/stock/transfer', requireAdmin, transferStock);

export default stockRouter;