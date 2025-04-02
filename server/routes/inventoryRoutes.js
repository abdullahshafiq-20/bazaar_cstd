// In your routes file:
import { getCurrentInventory, getProductInventory, getInventoryAlerts, getInventoryValue } from '../controllers/inventoryController.js';

import express from "express";
const inventoryRouter = express.Router();

// Define your routes here

inventoryRouter.get('/inventory', getCurrentInventory);
inventoryRouter.get('/inventory/product/:id', getProductInventory);
inventoryRouter.get('/inventory/alerts', getInventoryAlerts);
inventoryRouter.get('/inventory/value', getInventoryValue);


export default inventoryRouter;