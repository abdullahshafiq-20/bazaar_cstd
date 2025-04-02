import { getProducts, createProduct, createDemoProducts, getProductById, updateProduct, deleteProduct } from "../controllers/productController.js";
import express from "express";


const productRouter = express.Router();
// Define your routes here
productRouter.get("/product/get/", getProducts);
productRouter.get("/product/get_by_id/:id", getProductById);
productRouter.post("/product/create", createProduct);
productRouter.post("/product/create_demo", createDemoProducts);
productRouter.put("/product/update/:id", updateProduct);
productRouter.delete("/product/delete/:id", deleteProduct);     

// Add more routes as needed


export default productRouter;