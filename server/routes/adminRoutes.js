import express from 'express';
import { 
  assignStoreToManager,
  removeStoreAssignment,
  getAllStoreManagers,
  getManagerStores,
  getUnassignedStores,
  getAllAssignedStores
} from '../controllers/adminController.js';
import { verifyToken, requireAdmin } from '../middleware/authMiddleware.js';

const adminRouter = express.Router();

// All routes require authentication and admin privileges
adminRouter.use(verifyToken, requireAdmin);

// Store-Manager assignment routes
adminRouter.post('/admin/assignments', assignStoreToManager);
adminRouter.delete('/admin/assignments/:userId/:storeId', removeStoreAssignment);

// Manager information routes
adminRouter.get('/admin/managers', getAllStoreManagers);
adminRouter.get('/admin/managers/:userId/stores', getManagerStores);

// Store information routes
adminRouter.get('/admin/stores/unassigned', getUnassignedStores);
adminRouter.get('/admin/stores/assigned', getAllAssignedStores);

export default adminRouter;