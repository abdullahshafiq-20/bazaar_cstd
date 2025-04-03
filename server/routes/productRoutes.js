import { getProducts, createProduct, createDemoProducts, getProductById, updateProduct, deleteProduct } from "../controllers/productController.js";
import express from "express";
import { verifyToken, requireAdmin } from "../middleware/authMiddleware.js";


const productRouter = express.Router();
// Apply authentication to all routes
// productRouter.use(verifyToken);

// Define your routes here
productRouter.get("/product/get/", getProducts);
productRouter.get("/product/get_by_id/:id", getProductById);
productRouter.post("/product/create",verifyToken, requireAdmin, createProduct);
productRouter.post("/product/create_demo",verifyToken, requireAdmin, createDemoProducts);
productRouter.put("/product/update/:id",verifyToken, requireAdmin, updateProduct);
productRouter.delete("/product/delete/:id",verifyToken, requireAdmin, deleteProduct);     

// Add more routes as needed


export default productRouter;