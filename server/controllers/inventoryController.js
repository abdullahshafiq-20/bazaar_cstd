import pool from '../config/pool.js';

/**
 * @swagger
 * components:
 *   schemas:
 *     InventoryItem:
 *       type: object
 *       properties:
 *         product_id:
 *           type: integer
 *           description: The product ID
 *         name:
 *           type: string
 *           description: Product name
 *         sku:
 *           type: string
 *           description: Stock keeping unit
 *         category:
 *           type: string
 *           description: Product category
 *         unit_price:
 *           type: number
 *           format: float
 *           description: Current unit price
 *         current_quantity:
 *           type: integer
 *           description: Current available quantity in inventory
 *       example:
 *         product_id: 5
 *         name: Wireless Headphones
 *         sku: AUDIO-WH100
 *         category: Electronics
 *         unit_price: 149.99
 *         current_quantity: 24
 *     
 *     StockMovement:
 *       type: object
 *       properties:
 *         movement_id:
 *           type: integer
 *           description: Unique identifier for the stock movement
 *         movement_type:
 *           type: string
 *           enum: [STOCK_IN, SALE, MANUAL_REMOVAL]
 *           description: Type of stock movement
 *         quantity:
 *           type: integer
 *           description: Quantity involved in the movement
 *         unit_price:
 *           type: number
 *           format: float
 *           description: Unit price at the time of movement
 *         notes:
 *           type: string
 *           description: Additional notes about the movement
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: When the movement was recorded
 *       example:
 *         movement_id: 42
 *         movement_type: STOCK_IN
 *         quantity: 10
 *         unit_price: 149.99
 *         notes: Initial inventory
 *         created_at: 2023-01-01T00:00:00.000Z
 *     
 *     InventoryAlert:
 *       type: object
 *       properties:
 *         product_id:
 *           type: integer
 *         name:
 *           type: string
 *         sku:
 *           type: string
 *         category:
 *           type: string
 *         unit_price:
 *           type: number
 *           format: float
 *         current_quantity:
 *           type: integer
 *         status:
 *           type: string
 *           enum: [OUT_OF_STOCK, LOW_STOCK, OK]
 *       example:
 *         product_id: 5
 *         name: Wireless Headphones
 *         sku: AUDIO-WH100
 *         category: Electronics
 *         unit_price: 149.99
 *         current_quantity: 3
 *         status: LOW_STOCK
 */

/**
 * @swagger
 * tags:
 *   name: Inventory
 *   description: Store inventory management
 */

/**
 * @swagger
 * /api/stores/{id}/inventory:
 *   get:
 *     summary: Get current inventory for a store
 *     description: Returns all products with their current quantity in the specified store
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Store ID
 *     responses:
 *       200:
 *         description: A list of products in inventory
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 15
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/InventoryItem'
 *       401:
 *         description: Not authenticated or not authorized
 *       500:
 *         description: Server error
 */
export const getCurrentInventory = async (req, res) => {
  try {
    const storeId = parseInt(req.params.id);
    
    // Get all products with inventory levels for this store
    const query = `
      SELECT 
        p.product_id, 
        p.name, 
        p.sku, 
        p.category, 
        p.unit_price,
        COALESCE(SUM(CASE 
          WHEN sm.movement_type = 'STOCK_IN' THEN sm.quantity 
          WHEN sm.movement_type = 'SALE' THEN -sm.quantity
          WHEN sm.movement_type = 'MANUAL_REMOVAL' THEN -sm.quantity 
          ELSE 0
        END), 0) AS current_quantity
      FROM products p
      LEFT JOIN stock_movements sm ON p.product_id = sm.product_id AND sm.store_id = $1
      GROUP BY p.product_id, p.name, p.sku, p.category, p.unit_price
      HAVING COALESCE(SUM(CASE 
        WHEN sm.movement_type = 'STOCK_IN' THEN sm.quantity 
        WHEN sm.movement_type = 'SALE' THEN -sm.quantity
        WHEN sm.movement_type = 'MANUAL_REMOVAL' THEN -sm.quantity 
        ELSE 0
      END), 0) > 0
      ORDER BY p.name
    `;
    
    const result = await pool.query(query, [storeId]);
    
    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Error getting inventory:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @swagger
 * /api/stores/{id}/inventory/product/{productId}:
 *   get:
 *     summary: Get inventory details for a specific product
 *     description: Returns detailed inventory information for a specific product including movement history
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Store ID
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Detailed product inventory information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     product:
 *                       type: object
 *                       properties:
 *                         product_id:
 *                           type: integer
 *                         name:
 *                           type: string
 *                         description:
 *                           type: string
 *                         sku:
 *                           type: string
 *                         category:
 *                           type: string
 *                         unit_price:
 *                           type: number
 *                           format: float
 *                     current_quantity:
 *                       type: integer
 *                     movements:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/StockMovement'
 *       401:
 *         description: Not authenticated or not authorized
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */
export const getProductInventory = async (req, res) => {
  try {
    const storeId = parseInt(req.params.id);
    const productId = parseInt(req.params.productId);
    
    // Get product details
    const productQuery = `
      SELECT product_id, name, description, sku, category, unit_price
      FROM products WHERE product_id = $1
    `;
    
    const productResult = await pool.query(productQuery, [productId]);
    
    if (productResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Get inventory transactions
    const movementsQuery = `
      SELECT 
        movement_id, 
        movement_type, 
        quantity, 
        unit_price, 
        notes, 
        created_at
      FROM stock_movements
      WHERE product_id = $1 AND store_id = $2
      ORDER BY created_at DESC
    `;
    
    const movementsResult = await pool.query(movementsQuery, [productId, storeId]);
    
    // Calculate current quantity
    const quantityQuery = `
      SELECT COALESCE(SUM(CASE 
        WHEN movement_type = 'STOCK_IN' THEN quantity 
        WHEN movement_type IN ('SALE', 'MANUAL_REMOVAL') THEN -quantity
        ELSE 0
      END), 0) AS current_quantity
      FROM stock_movements
      WHERE product_id = $1 AND store_id = $2
    `;
    
    const quantityResult = await pool.query(quantityQuery, [productId, storeId]);
    
    res.status(200).json({
      success: true,
      data: {
        product: productResult.rows[0],
        current_quantity: parseInt(quantityResult.rows[0].current_quantity),
        movements: movementsResult.rows
      }
    });
  } catch (error) {
    console.error('Error getting product inventory:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @swagger
 * /api/stores/{id}/inventory/add:
 *   post:
 *     summary: Add product to inventory
 *     description: Add a quantity of a product to the store's inventory
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Store ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - quantity
 *             properties:
 *               productId:
 *                 type: integer
 *                 description: Product ID to add to inventory
 *               quantity:
 *                 type: integer
 *                 description: Quantity to add (must be > 0)
 *               unitPrice:
 *                 type: number
 *                 format: float
 *                 description: Optional override of product unit price
 *               notes:
 *                 type: string
 *                 description: Optional notes about this addition
 *     responses:
 *       201:
 *         description: Product successfully added to inventory
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Product added to inventory
 *                 data:
 *                   type: object
 *                   properties:
 *                     product:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         name:
 *                           type: string
 *                         sku:
 *                           type: string
 *                         category:
 *                           type: string
 *                         unit_price:
 *                           type: number
 *                           format: float
 *                     quantity_added:
 *                       type: integer
 *                     current_quantity:
 *                       type: integer
 *                     movement:
 *                       $ref: '#/components/schemas/StockMovement'
 *       400:
 *         description: Invalid request - missing required fields or invalid quantity
 *       401:
 *         description: Not authenticated or not authorized
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */
export const addProductToInventory = async (req, res) => {
  try {
    const storeId = parseInt(req.params.id);
    const { productId, quantity, unitPrice, notes } = req.body;
    
    // Validate input
    if (!productId || !quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Product ID and quantity (> 0) are required'
      });
    }
    
    // Begin transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Check if the product exists
      const productCheck = await client.query(
        'SELECT * FROM products WHERE product_id = $1',
        [productId]
      );
      
      if (productCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }
      
      const product = productCheck.rows[0];
      
      // Add stock movement
      const stockPrice = unitPrice || product.unit_price;
      const stockNotes = notes || 'Initial inventory';
      
      const movementQuery = `
        INSERT INTO stock_movements 
        (product_id, store_id, movement_type, quantity, unit_price, notes)
        VALUES ($1, $2, 'STOCK_IN', $3, $4, $5)
        RETURNING *
      `;
      
      const movementResult = await client.query(
        movementQuery,
        [productId, storeId, quantity, stockPrice, stockNotes]
      );
      
      // Get updated inventory
      const inventoryQuery = `
        SELECT COALESCE(SUM(CASE 
          WHEN movement_type = 'STOCK_IN' THEN quantity 
          WHEN movement_type IN ('SALE', 'MANUAL_REMOVAL') THEN -quantity
          ELSE 0
        END), 0) AS current_quantity
        FROM stock_movements
        WHERE product_id = $1 AND store_id = $2
      `;
      
      const inventoryResult = await client.query(
        inventoryQuery,
        [productId, storeId]
      );
      
      await client.query('COMMIT');
      
      res.status(201).json({
        success: true,
        message: 'Product added to inventory',
        data: {
          product: {
            id: product.product_id,
            name: product.name,
            sku: product.sku,
            category: product.category,
            unit_price: product.unit_price
          },
          quantity_added: quantity,
          current_quantity: parseInt(inventoryResult.rows[0].current_quantity),
          movement: movementResult.rows[0]
        }
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error adding product to inventory:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @swagger
 * /api/stores/{id}/inventory/remove:
 *   post:
 *     summary: Remove product from inventory
 *     description: Remove a quantity of a product from the store's inventory (not sales)
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Store ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - quantity
 *               - reason
 *             properties:
 *               productId:
 *                 type: integer
 *                 description: Product ID to remove from inventory
 *               quantity:
 *                 type: integer
 *                 description: Quantity to remove (must be > 0)
 *               reason:
 *                 type: string
 *                 description: Reason for removal (required)
 *     responses:
 *       200:
 *         description: Product successfully removed from inventory
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Product removed from inventory
 *                 data:
 *                   type: object
 *                   properties:
 *                     previous_quantity:
 *                       type: integer
 *                     quantity_removed:
 *                       type: integer
 *                     current_quantity:
 *                       type: integer
 *                     movement:
 *                       $ref: '#/components/schemas/StockMovement'
 *       400:
 *         description: Invalid request - missing fields, invalid quantity, or insufficient inventory
 *       401:
 *         description: Not authenticated or not authorized
 *       500:
 *         description: Server error
 */
export const removeFromInventory = async (req, res) => {
  try {
    const storeId = parseInt(req.params.id);
    const { productId, quantity, reason } = req.body;
    
    // Validate input
    if (!productId || !quantity || quantity <= 0 || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Product ID, quantity (> 0), and reason are required'
      });
    }
    
    // Begin transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Check current inventory
      const inventoryQuery = `
        SELECT COALESCE(SUM(CASE 
          WHEN movement_type = 'STOCK_IN' THEN quantity 
          WHEN movement_type IN ('SALE', 'MANUAL_REMOVAL') THEN -quantity
          ELSE 0
        END), 0) AS current_quantity
        FROM stock_movements
        WHERE product_id = $1 AND store_id = $2
      `;
      
      const inventoryResult = await client.query(
        inventoryQuery,
        [productId, storeId]
      );
      
      const currentQuantity = parseInt(inventoryResult.rows[0].current_quantity);
      
      // Check if enough inventory
      if (currentQuantity < quantity) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: `Insufficient inventory. Current quantity: ${currentQuantity}`
        });
      }
      
      // Add removal movement
      const movementQuery = `
        INSERT INTO stock_movements 
        (product_id, store_id, movement_type, quantity, notes)
        VALUES ($1, $2, 'MANUAL_REMOVAL', $3, $4)
        RETURNING *
      `;
      
      const movementResult = await client.query(
        movementQuery,
        [productId, storeId, quantity, reason]
      );
      
      // Get updated inventory
      const updatedInventoryResult = await client.query(
        inventoryQuery,
        [productId, storeId]
      );
      
      await client.query('COMMIT');
      
      res.status(200).json({
        success: true,
        message: 'Product removed from inventory',
        data: {
          previous_quantity: currentQuantity,
          quantity_removed: quantity,
          current_quantity: parseInt(updatedInventoryResult.rows[0].current_quantity),
          movement: movementResult.rows[0]
        }
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error removing from inventory:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @swagger
 * /api/stores/{id}/inventory/alerts:
 *   get:
 *     summary: Get inventory alerts
 *     description: Returns products that are out of stock or have low stock levels
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Store ID
 *       - in: query
 *         name: threshold
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Low stock threshold level
 *     responses:
 *       200:
 *         description: List of inventory alerts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 5
 *                 low_stock_threshold:
 *                   type: integer
 *                   example: 10
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/InventoryAlert'
 *       401:
 *         description: Not authenticated or not authorized
 *       500:
 *         description: Server error
 */
export const getInventoryAlerts = async (req, res) => {
  try {
    const storeId = parseInt(req.params.id);
    const lowStockThreshold = parseInt(req.query.threshold || 10);
    
    // Get products with low inventory that have been added to the inventory
    const query = `
      SELECT 
        p.product_id, 
        p.name, 
        p.sku, 
        p.category, 
        p.unit_price,
        COALESCE(SUM(CASE 
          WHEN sm.movement_type = 'STOCK_IN' THEN sm.quantity 
          WHEN sm.movement_type IN ('SALE', 'MANUAL_REMOVAL') THEN -sm.quantity
          ELSE 0
        END), 0) AS current_quantity,
        CASE 
          WHEN COALESCE(SUM(CASE 
            WHEN sm.movement_type = 'STOCK_IN' THEN sm.quantity 
            WHEN sm.movement_type IN ('SALE', 'MANUAL_REMOVAL') THEN -sm.quantity
            ELSE 0
          END), 0) = 0 THEN 'OUT_OF_STOCK'
          WHEN COALESCE(SUM(CASE 
            WHEN sm.movement_type = 'STOCK_IN' THEN sm.quantity 
            WHEN sm.movement_type IN ('SALE', 'MANUAL_REMOVAL') THEN -sm.quantity
            ELSE 0
          END), 0) <= $2 THEN 'LOW_STOCK'
          ELSE 'OK'
        END AS status
      FROM products p
      INNER JOIN (
        SELECT DISTINCT product_id
        FROM stock_movements
        WHERE store_id = $1 AND movement_type = 'STOCK_IN'
      ) AS added_products ON p.product_id = added_products.product_id
      LEFT JOIN stock_movements sm ON p.product_id = sm.product_id AND sm.store_id = $1
      GROUP BY p.product_id, p.name, p.sku, p.category, p.unit_price
      HAVING COALESCE(SUM(CASE 
        WHEN sm.movement_type = 'STOCK_IN' THEN sm.quantity 
        WHEN sm.movement_type IN ('SALE', 'MANUAL_REMOVAL') THEN -sm.quantity
        ELSE 0
      END), 0) <= $2
      ORDER BY current_quantity ASC, p.name
    `;
    
    const result = await pool.query(query, [storeId, lowStockThreshold]);
    
    res.status(200).json({
      success: true,
      count: result.rows.length,
      low_stock_threshold: lowStockThreshold,
      data: result.rows
    });
  } catch (error) {
    console.error('Error getting inventory alerts:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @swagger
 * /api/stores/{id}/inventory/value:
 *   get:
 *     summary: Get inventory value
 *     description: Returns the total value of inventory in the store, broken down by category
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Store ID
 *     responses:
 *       200:
 *         description: Inventory value summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: object
 *                       properties:
 *                         total_value:
 *                           type: number
 *                           format: float
 *                           example: 24750.50
 *                         total_products:
 *                           type: integer
 *                           example: 45
 *                         total_items:
 *                           type: integer
 *                           example: 532
 *                     by_category:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           category:
 *                             type: string
 *                             example: Electronics
 *                           product_count:
 *                             type: integer
 *                             example: 15
 *                           inventory_value:
 *                             type: number
 *                             format: float
 *                             example: 12500.75
 *       401:
 *         description: Not authenticated or not authorized
 *       500:
 *         description: Server error
 */
export const getInventoryValue = async (req, res) => {
  try {
    const storeId = parseInt(req.params.id);
    
    // Calculate inventory value
    const query = `
      SELECT 
        p.category,
        COUNT(DISTINCT p.product_id) AS product_count,
        SUM(
          COALESCE(
            (SELECT SUM(CASE 
              WHEN movement_type = 'STOCK_IN' THEN quantity 
              WHEN movement_type IN ('SALE', 'MANUAL_REMOVAL') THEN -quantity
              ELSE 0
            END) 
            FROM stock_movements 
            WHERE product_id = p.product_id AND store_id = $1),
            0
          ) * p.unit_price
        ) AS inventory_value
      FROM 
        products p
      WHERE 
        EXISTS (
          SELECT 1 FROM stock_movements 
          WHERE product_id = p.product_id 
          AND store_id = $1 
          GROUP BY product_id 
          HAVING SUM(CASE 
            WHEN movement_type = 'STOCK_IN' THEN quantity 
            WHEN movement_type IN ('SALE', 'MANUAL_REMOVAL') THEN -quantity
            ELSE 0
          END) > 0
        )
      GROUP BY p.category
      ORDER BY inventory_value DESC
    `;
    
    const categoryValues = await pool.query(query, [storeId]);
    
    // Get total value
    const totalQuery = `
      SELECT 
        SUM(
          COALESCE(
            (SELECT SUM(CASE 
              WHEN movement_type = 'STOCK_IN' THEN quantity 
              WHEN movement_type IN ('SALE', 'MANUAL_REMOVAL') THEN -quantity
              ELSE 0
            END) 
            FROM stock_movements 
            WHERE product_id = p.product_id AND store_id = $1),
            0
          ) * p.unit_price
        ) AS total_value,
        COUNT(DISTINCT p.product_id) AS total_products,
        SUM(
          COALESCE(
            (SELECT SUM(CASE 
              WHEN movement_type = 'STOCK_IN' THEN quantity 
              WHEN movement_type IN ('SALE', 'MANUAL_REMOVAL') THEN -quantity
              ELSE 0
            END) 
            FROM stock_movements 
            WHERE product_id = p.product_id AND store_id = $1),
            0
          )
        ) AS total_items
      FROM 
        products p
      WHERE 
        EXISTS (
          SELECT 1 FROM stock_movements 
          WHERE product_id = p.product_id 
          AND store_id = $1 
          GROUP BY product_id 
          HAVING SUM(CASE 
            WHEN movement_type = 'STOCK_IN' THEN quantity 
            WHEN movement_type IN ('SALE', 'MANUAL_REMOVAL') THEN -quantity
            ELSE 0
          END) > 0
        )
    `;
    
    const totalValue = await pool.query(totalQuery, [storeId]);
    
    res.status(200).json({
      success: true,
      data: {
        total: totalValue.rows[0],
        by_category: categoryValues.rows
      }
    });
  } catch (error) {
    console.error('Error calculating inventory value:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};