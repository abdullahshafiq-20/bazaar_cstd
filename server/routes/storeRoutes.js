import express from 'express';
import { 
  getAllStores, 
  getStoreById, 
  createStore, 
  updateStore, 
  deleteStore, 
  toggleStoreStatus,
  getStoreManagers,
  getAllStoresFullDetails
} from '../controllers/storeController.js';
import { verifyToken, requireAdmin } from '../middleware/authMiddleware.js';
import dateRangeFilter from '../middlewares/dateRangeFilter.js';

const storeRouter = express.Router();

// Public routes (if any)

// Protected routes - require authentication
storeRouter.use(verifyToken);

// Routes accessible to any authenticated user
storeRouter.get('/stores', getAllStores);
storeRouter.get('/stores/:id', getStoreById);

// Admin-only routes
storeRouter.post('/stores', requireAdmin, createStore);
storeRouter.put('/stores/:id', requireAdmin, updateStore);
storeRouter.delete('/stores/:id', requireAdmin, deleteStore);
storeRouter.patch('/stores/:id/status', requireAdmin, toggleStoreStatus);
storeRouter.get('/stores/:id/managers', requireAdmin, getStoreManagers);
storeRouter.get('/stores/reports/all', requireAdmin, dateRangeFilter, getAllStoresFullDetails);

export default storeRouter;