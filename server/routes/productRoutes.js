import { getProducts, createProduct, createDemoProducts, getProductById, updateProduct, deleteProduct } from "../controllers/productController.js";
import express from "express";
import { verifyToken, requireAdmin } from "../middleware/authMiddleware.js";


const productRouter = express.Router();
// Apply authentication to all routes
productRouter.use(verifyToken);

// Define your routes here
productRouter.get("/product/get/", requireAdmin, getProducts);
productRouter.get("/product/get_by_id/:id", requireAdmin, getProductById);
productRouter.post("/product/create", requireAdmin, createProduct);
productRouter.post("/product/create_demo", requireAdmin, createDemoProducts);
productRouter.put("/product/update/:id", requireAdmin, updateProduct);
productRouter.delete("/product/delete/:id", requireAdmin, deleteProduct);     

// Add more routes as needed


export default productRouter;