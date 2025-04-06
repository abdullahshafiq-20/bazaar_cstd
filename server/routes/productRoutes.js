import { getProducts, createProduct, createDemoProducts, getProductById, updateProduct, deleteProduct } from "../controllers/productController.js";
import express from "express";
import { verifyToken, requireAdmin } from "../middleware/authMiddleware.js";

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Product management API
 */

const productRouter = express.Router();

/**
 * @swagger
 * /api/product/get:
 *   get:
 *     summary: Get all products
 *     description: Retrieve a list of all products
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: A list of products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
productRouter.get("/product/get/", getProducts);

/**
 * @swagger
 * /api/product/get_by_id/{id}:
 *   get:
 *     summary: Get a product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Numeric ID of the product to get
 */
productRouter.get("/product/get_by_id/:id", getProductById);

/**
 * @swagger
 * /api/product/create:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 */
productRouter.post("/product/create", verifyToken, requireAdmin, createProduct);

/**
 * @swagger
 * /api/product/create_demo:
 *   post:
 *     summary: Create demo products
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 */
productRouter.post("/product/create_demo", verifyToken, requireAdmin, createDemoProducts);

/**
 * @swagger
 * /api/product/update/{id}:
 *   put:
 *     summary: Update a product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Numeric ID of the product to update
 */
productRouter.put("/product/update/:id", verifyToken, requireAdmin, updateProduct);

/**
 * @swagger
 * /api/product/delete/{id}:
 *   delete:
 *     summary: Delete a product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Numeric ID of the product to delete
 */
productRouter.delete("/product/delete/:id", verifyToken, requireAdmin, deleteProduct);     

export default productRouter;