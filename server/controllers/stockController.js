import pool from '../config/pool.js';

/**
 * @swagger
 * components:
 *   schemas:
 *     StockMovement:
 *       type: object
 *       required:
 *         - product_id
 *         - movement_type
 *         - quantity
 *       properties:
 *         movement_id:
 *           type: integer
 *           description: The auto-generated ID of the stock movement
 *         product_id:
 *           type: integer
 *           description: The ID of the product being affected
 *         movement_type:
 *           type: string
 *           enum: [STOCK_IN, SALE, MANUAL_REMOVAL]
 *           description: Type of stock movement
 *         quantity:
 *           type: integer
 *           description: Quantity of product involved in the movement
 *         unit_price:
 *           type: number
 *           format: float
 *           description: Unit price of the product during this movement
 *         notes:
 *           type: string
 *           description: Additional notes about the movement
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Date and time when the movement was recorded
 *       example:
 *         movement_id: 1
 *         product_id: 5
 *         movement_type: STOCK_IN
 *         quantity: 50
 *         unit_price: 24.99
 *         notes: Initial stock addition
 *         created_at: 2023-01-01T00:00:00.000Z
 *     
 *     CurrentStock:
 *       type: object
 *       properties:
 *         product_id:
 *           type: integer
 *           description: The ID of the product
 *         name:
 *           type: string
 *           description: The name of the product
 *         sku:
 *           type: string
 *           description: Product SKU (Stock Keeping Unit)
 *         category:
 *           type: string
 *           description: Product category
 *         unit_price:
 *           type: number
 *           format: float
 *           description: Current unit price of the product
 *         current_stock:
 *           type: integer
 *           description: Current available quantity
 *       example:
 *         product_id: 5
 *         name: Wireless Headphones
 *         sku: AUDIO-WH100
 *         category: Electronics
 *         unit_price: 24.99
 *         current_stock: 42
 */

/**
 * @swagger
 * tags:
 *   name: Stock
 *   description: API for managing stock and inventory movements
 */

/**
 * @swagger
 * /api/stock/add:
 *   post:
 *     summary: Add stock to a product
 *     tags: [Stock]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - product_id
 *               - quantity
 *             properties:
 *               product_id:
 *                 type: integer
 *                 description: The ID of the product to add stock to
 *               quantity:
 *                 type: integer
 *                 description: Quantity to add (must be greater than zero)
 *               unit_price:
 *                 type: number
 *                 format: float
 *                 description: Optional unit price (if different from product's default price)
 *               notes:
 *                 type: string
 *                 description: Optional notes about this stock addition
 *     responses:
 *       201:
 *         description: Stock added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Stock added successfully
 *                 movement:
 *                   $ref: '#/components/schemas/StockMovement'
 *       400:
 *         description: Bad request - Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Product ID and quantity are required
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Product not found
 *       500:
 *         description: Internal server error
 */
export const addStock = async (req, res) => {
    try {
        const { product_id, quantity, unit_price, notes } = req.body;
        
        // Input validation
        if (!product_id || !quantity) {
            return res.status(400).json({ error: 'Product ID and quantity are required' });
        }
        
        if (quantity <= 0) {
            return res.status(400).json({ error: 'Quantity must be greater than zero' });
        }
        
        // Check if product exists
        const productQuery = 'SELECT * FROM products WHERE product_id = $1';
        const productResult = await pool.query(productQuery, [product_id]);
        
        if (productResult.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        // Insert stock movement record
        const insertQuery = `
            INSERT INTO stock_movements (product_id, movement_type, quantity, unit_price, notes)
            VALUES ($1, 'STOCK_IN', $2, $3, $4)
            RETURNING movement_id, product_id, movement_type, quantity, unit_price, notes, created_at
        `;
        
        const values = [
            product_id,
            quantity,
            unit_price || productResult.rows[0].unit_price, // Use provided price or product's price
            notes || 'Stock addition'
        ];
        
        const result = await pool.query(insertQuery, values);
        
        res.status(201).json({
            message: 'Stock added successfully',
            movement: result.rows[0]
        });
    } catch (error) {
        console.error('Error adding stock:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * @swagger
 * /api/stock/sale:
 *   post:
 *     summary: Record a product sale
 *     tags: [Stock]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - product_id
 *               - quantity
 *             properties:
 *               product_id:
 *                 type: integer
 *                 description: The ID of the product sold
 *               quantity:
 *                 type: integer
 *                 description: Quantity sold (must be greater than zero)
 *               unit_price:
 *                 type: number
 *                 format: float
 *                 description: Optional sale price (if different from product's default price)
 *               notes:
 *                 type: string
 *                 description: Optional notes about this sale
 *     responses:
 *       201:
 *         description: Sale recorded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Sale recorded successfully
 *                 movement:
 *                   $ref: '#/components/schemas/StockMovement'
 *                 remainingStock:
 *                   type: integer
 *                   example: 42
 *       400:
 *         description: Bad request - Invalid input or insufficient stock
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Insufficient stock
 *                 currentStock:
 *                   type: integer
 *                   example: 5
 *                 requestedQuantity:
 *                   type: integer
 *                   example: 10
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */
export const recordSale = async (req, res) => {
    try {
        const { product_id, quantity, unit_price, notes } = req.body;
        
        // Input validation
        if (!product_id || !quantity) {
            return res.status(400).json({ error: 'Product ID and quantity are required' });
        }
        
        if (quantity <= 0) {
            return res.status(400).json({ error: 'Quantity must be greater than zero' });
        }
        
        // Check if product exists
        const productQuery = 'SELECT * FROM products WHERE product_id = $1';
        const productResult = await pool.query(productQuery, [product_id]);
        
        if (productResult.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        // Check current stock level
        const stockQuery = `
            SELECT COALESCE(SUM(
                CASE WHEN movement_type = 'STOCK_IN' THEN quantity
                     ELSE -quantity END
            ), 0) AS current_stock
            FROM stock_movements
            WHERE product_id = $1
        `;
        
        const stockResult = await pool.query(stockQuery, [product_id]);
        const currentStock = parseInt(stockResult.rows[0].current_stock);
        
        if (currentStock < quantity) {
            return res.status(400).json({ 
                error: 'Insufficient stock',
                currentStock,
                requestedQuantity: quantity
            });
        }
        
        // Insert sale movement record
        const insertQuery = `
            INSERT INTO stock_movements (product_id, movement_type, quantity, unit_price, notes)
            VALUES ($1, 'SALE', $2, $3, $4)
            RETURNING movement_id, product_id, movement_type, quantity, unit_price, notes, created_at
        `;
        
        const values = [
            product_id,
            quantity,
            unit_price || productResult.rows[0].unit_price, // Use provided price or product's price
            notes || 'Sale transaction'
        ];
        
        const result = await pool.query(insertQuery, values);
        
        res.status(201).json({
            message: 'Sale recorded successfully',
            movement: result.rows[0],
            remainingStock: currentStock - quantity
        });
    } catch (error) {
        console.error('Error recording sale:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * @swagger
 * /api/stock/remove:
 *   post:
 *     summary: Manual removal of stock
 *     tags: [Stock]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - product_id
 *               - quantity
 *             properties:
 *               product_id:
 *                 type: integer
 *                 description: The ID of the product to remove
 *               quantity:
 *                 type: integer
 *                 description: Quantity to remove (must be greater than zero)
 *               notes:
 *                 type: string
 *                 description: Optional notes about this removal (e.g., damage, loss)
 *     responses:
 *       201:
 *         description: Stock removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Stock removed successfully
 *                 movement:
 *                   $ref: '#/components/schemas/StockMovement'
 *                 remainingStock:
 *                   type: integer
 *                   example: 38
 *       400:
 *         description: Bad request - Invalid input or insufficient stock
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Insufficient stock
 *                 currentStock:
 *                   type: integer
 *                   example: 5
 *                 requestedQuantity:
 *                   type: integer
 *                   example: 10
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */
export const manualRemoval = async (req, res) => {
    try {
        const { product_id, quantity, notes } = req.body;
        
        // Input validation
        if (!product_id || !quantity) {
            return res.status(400).json({ error: 'Product ID and quantity are required' });
        }
        
        if (quantity <= 0) {
            return res.status(400).json({ error: 'Quantity must be greater than zero' });
        }
        
        // Check if product exists
        const productQuery = 'SELECT * FROM products WHERE product_id = $1';
        const productResult = await pool.query(productQuery, [product_id]);
        
        if (productResult.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        // Check current stock level
        const stockQuery = `
            SELECT COALESCE(SUM(
                CASE WHEN movement_type = 'STOCK_IN' THEN quantity
                     ELSE -quantity END
            ), 0) AS current_stock
            FROM stock_movements
            WHERE product_id = $1
        `;
        
        const stockResult = await pool.query(stockQuery, [product_id]);
        const currentStock = parseInt(stockResult.rows[0].current_stock);
        
        if (currentStock < quantity) {
            return res.status(400).json({ 
                error: 'Insufficient stock',
                currentStock,
                requestedQuantity: quantity
            });
        }
        
        // Insert manual removal record
        const insertQuery = `
            INSERT INTO stock_movements (product_id, movement_type, quantity, unit_price, notes)
            VALUES ($1, 'MANUAL_REMOVAL', $2, $3, $4)
            RETURNING movement_id, product_id, movement_type, quantity, unit_price, notes, created_at
        `;
        
        const values = [
            product_id,
            quantity,
            productResult.rows[0].unit_price, // Use product's price for consistency
            notes || 'Manual stock removal'
        ];
        
        const result = await pool.query(insertQuery, values);
        
        res.status(201).json({
            message: 'Stock removed successfully',
            movement: result.rows[0],
            remainingStock: currentStock - quantity
        });
    } catch (error) {
        console.error('Error removing stock:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * @swagger
 * /api/stock/movements:
 *   get:
 *     summary: Get stock movement history
 *     description: Retrieve stock movements with optional filtering
 *     tags: [Stock]
 *     parameters:
 *       - in: query
 *         name: product_id
 *         schema:
 *           type: integer
 *         description: Filter by product ID
 *       - in: query
 *         name: movement_type
 *         schema:
 *           type: string
 *           enum: [STOCK_IN, SALE, MANUAL_REMOVAL]
 *         description: Filter by movement type
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date (YYYY-MM-DD)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: List of stock movements
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   movement_id:
 *                     type: integer
 *                   product_id:
 *                     type: integer
 *                   product_name:
 *                     type: string
 *                   movement_type:
 *                     type: string
 *                   quantity:
 *                     type: integer
 *                   unit_price:
 *                     type: number
 *                     format: float
 *                   notes:
 *                     type: string
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *       404:
 *         description: No stock movements found
 *       500:
 *         description: Internal server error
 */
export const getStockMovements = async (req, res) => {
    try {
        const { product_id, movement_type, start_date, end_date } = req.query;
        
        let queryConditions = [];
        let values = [];
        let paramIndex = 1;
        
        // Base query with join to get product names
        let queryText = `
            SELECT sm.movement_id, sm.product_id, p.name as product_name, 
                   sm.movement_type, sm.quantity, sm.unit_price, 
                   sm.notes, sm.created_at
            FROM stock_movements sm
            JOIN products p ON sm.product_id = p.product_id
        `;
        
        // Add filters if provided
        if (product_id) {
            queryConditions.push(`sm.product_id = $${paramIndex}`);
            values.push(product_id);
            paramIndex++;
        }
        
        if (movement_type) {
            queryConditions.push(`sm.movement_type = $${paramIndex}`);
            values.push(movement_type);
            paramIndex++;
        }
        
        if (start_date) {
            queryConditions.push(`sm.created_at >= $${paramIndex}`);
            values.push(start_date);
            paramIndex++;
        }
        
        if (end_date) {
            queryConditions.push(`sm.created_at <= $${paramIndex}`);
            values.push(end_date);
            paramIndex++;
        }
        
        // Add WHERE clause if we have conditions
        if (queryConditions.length > 0) {
            queryText += ` WHERE ${queryConditions.join(' AND ')}`;
        }
        
        // Add sorting
        queryText += ` ORDER BY sm.created_at DESC`;
        
        const result = await pool.query(queryText, values);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'No stock movements found' });
        }
        
        
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching stock movements:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * @swagger
 * /api/stock/current:
 *   get:
 *     summary: Get current stock levels
 *     description: Retrieve current stock levels for all products or filtered by category
 *     tags: [Stock]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by product category
 *     responses:
 *       200:
 *         description: List of products with current stock levels
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CurrentStock'
 *       400:
 *         description: Data consistency issues detected
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Negative stock levels detected
 *       404:
 *         description: No stock found
 *       500:
 *         description: Internal server error
 */
export const getCurrentStock = async (req, res) => {
    try {
        const { category } = req.query;
        
        let queryText = `
            SELECT 
                p.product_id, 
                p.name, 
                p.sku, 
                p.category,
                p.unit_price,
                COALESCE(SUM(
                    CASE WHEN sm.movement_type = 'STOCK_IN' THEN sm.quantity
                         ELSE -sm.quantity END
                ), 0) AS current_stock
            FROM products p
            LEFT JOIN stock_movements sm ON p.product_id = sm.product_id
        `;
        
        const values = [];
        
        // Add category filter if provided
        if (category) {
            queryText += ` WHERE p.category = $1`;
            values.push(category);
        }
        
        queryText += `
            GROUP BY p.product_id, p.name, p.sku, p.category, p.unit_price
            ORDER BY p.name
        `;
        
        const result = await pool.query(queryText, values);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'No stock found' });
        }
        // Check if any product has a negative stock level
        const negativeStock = result.rows.some(row => row.current_stock < 0);
        if (negativeStock) {
            return res.status(400).json({ error: 'Negative stock levels detected' });
        }
        // Check if any product has a stock level of zero
        const zeroStock = result.rows.some(row => row.current_stock === 0);
        if (zeroStock) {
            return res.status(400).json({ error: 'Zero stock levels detected' });
        }
        
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching current stock:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};