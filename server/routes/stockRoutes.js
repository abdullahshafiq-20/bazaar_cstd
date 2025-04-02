import { addStock, recordSale, manualRemoval, getStockMovements, getCurrentStock } from '../controllers/stockController.js';
import express from "express";


const stockRouter = express.Router();




stockRouter.post('/stock/add', addStock);
stockRouter.post('/stock/sale', recordSale);
stockRouter.post('/stock/remove', manualRemoval);
stockRouter.get('/stock/movements', getStockMovements);
stockRouter.get('/stock/current', getCurrentStock);

export default stockRouter;