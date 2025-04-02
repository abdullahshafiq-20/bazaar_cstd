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

const inventoryRouter = express.Router();

// Apply authentication to all routes
inventoryRouter.use(verifyToken);

// Store inventory routes - all require store manager permission
inventoryRouter.get('/stores/:id/inventory', requireStoreManager, getCurrentInventory);
inventoryRouter.get('/stores/:id/inventory/product/:productId', requireStoreManager, getProductInventory);
inventoryRouter.post('/stores/:id/inventory/add', requireStoreManager, addProductToInventory);
inventoryRouter.post('/stores/:id/inventory/remove', requireStoreManager, removeFromInventory);
inventoryRouter.get('/stores/:id/inventory/alerts', requireStoreManager, getInventoryAlerts);
inventoryRouter.get('/stores/:id/inventory/value', requireStoreManager, getInventoryValue);

export default inventoryRouter;