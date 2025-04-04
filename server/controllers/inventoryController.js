import pool from '../config/pool.js';

/**
 * @swagger
 * /api/inventory:
 *   get:
 *     summary: Get current inventory
 *     description: Returns a summary of current inventory for all products or filtered subset
 *     tags: [Inventory]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by product category
 *       - in: query
 *         name: minStock
 *         schema:
 *           type: integer
 *         description: Minimum stock quantity filter
 *       - in: query
 *         name: maxStock
 *         schema:
 *           type: integer
 *         description: Maximum stock quantity filter
 *       - in: query
 *         name: lowStock
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filter for items with low stock levels
 *       - in: query
 *         name: threshold
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Threshold for low stock (used with lowStock=true)
 *       - in: query
 *         name: outOfStock
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filter for out of stock items
 *     responses:
 *       200:
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total_products:
 *                   type: integer
 *                 total_inventory_value:
 *                   type: string
 *                 out_of_stock_count:
 *                   type: integer
 *                 categories:
 *                   type: array
 *                   items:
 *                     type: string
 *                 products:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       product_id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       sku:
 *                         type: string
 *                       category:
 *                         type: string
 *                       current_quantity:
 *                         type: integer
 *                       unit_price:
 *                         type: number
 *                       inventory_value:
 *                         type: number
 *       500:
 *         description: Internal server error
 */
export const getCurrentInventory = async (req, res) => {
    try {
        const { category, minStock, maxStock, lowStock, outOfStock } = req.query;
        
        let queryConditions = [];
        let values = [];
        let paramIndex = 1;
        
        // Base query using the current_inventory view
        let queryText = `
            SELECT 
                ci.product_id,
                ci.name,
                ci.sku,
                ci.category,
                ci.current_quantity,
                p.unit_price,
                (ci.current_quantity * p.unit_price) AS inventory_value
            FROM 
                current_inventory ci
            JOIN
                products p ON ci.product_id = p.product_id
        `;
        
        // Add filters if provided
        if (category) {
            queryConditions.push(`ci.category = $${paramIndex}`);
            values.push(category);
            paramIndex++;
        }
        
        if (minStock !== undefined) {
            queryConditions.push(`ci.current_quantity >= $${paramIndex}`);
            values.push(parseInt(minStock));
            paramIndex++;
        }
        
        if (maxStock !== undefined) {
            queryConditions.push(`ci.current_quantity <= $${paramIndex}`);
            values.push(parseInt(maxStock));
            paramIndex++;
        }
        
        // Special filter for low stock items (less than specified amount)
        if (lowStock === 'true') {
            const threshold = req.query.threshold || 10; // Default threshold of 10
            queryConditions.push(`ci.current_quantity > 0 AND ci.current_quantity <= $${paramIndex}`);
            values.push(parseInt(threshold));
            paramIndex++;
        }
        
        // Special filter for out of stock items
        if (outOfStock === 'true') {
            queryConditions.push(`ci.current_quantity <= 0`);
        }
        
        // Add WHERE clause if we have conditions
        if (queryConditions.length > 0) {
            queryText += ` WHERE ${queryConditions.join(' AND ')}`;
        }
        
        // Add sorting - first by category, then by name
        queryText += ` ORDER BY ci.category, ci.name`;
        
        const result = await pool.query(queryText, values);
        
        // Calculate total inventory value
        const totalValue = result.rows.reduce((sum, item) => sum + parseFloat(item.inventory_value || 0), 0);
        
        // Generate inventory summary
        const summary = {
            total_products: result.rows.length,
            total_inventory_value: totalValue.toFixed(2),
            out_of_stock_count: result.rows.filter(item => item.current_quantity <= 0).length,
            categories: [...new Set(result.rows.map(item => item.category))],
            products: result.rows
        };
        
        res.json(summary);
    } catch (error) {
        console.error('Error fetching inventory:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * @swagger
 * /api/inventory/products/{id}:
 *   get:
 *     summary: Get inventory details for a specific product
 *     description: Returns current quantity, recent movements, and value for a specific product
 *     tags: [Inventory]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 product:
 *                   type: object
 *                   properties:
 *                     product_id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     sku:
 *                       type: string
 *                     category:
 *                       type: string
 *                     current_quantity:
 *                       type: integer
 *                     unit_price:
 *                       type: number
 *                     description:
 *                       type: string
 *                     inventory_value:
 *                       type: number
 *                 inventory_status:
 *                   type: object
 *                   properties:
 *                     current_quantity:
 *                       type: integer
 *                     inventory_value:
 *                       type: number
 *                     is_in_stock:
 *                       type: boolean
 *                 movement_summary:
 *                   type: object
 *                   properties:
 *                     total_in:
 *                       type: integer
 *                     total_out:
 *                       type: integer
 *                     net_change:
 *                       type: integer
 *                 recent_movements:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       movement_id:
 *                         type: integer
 *                       movement_type:
 *                         type: string
 *                       quantity:
 *                         type: integer
 *                       unit_price:
 *                         type: number
 *                       notes:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *       400:
 *         description: Bad request - Product ID is required
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */
export const getProductInventory = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id) {
            return res.status(400).json({ error: 'Product ID is required' });
        }
        
        // Get product details and current quantity
        const productQuery = `
            SELECT 
                ci.product_id,
                ci.name,
                ci.sku,
                ci.category,
                ci.current_quantity,
                p.unit_price,
                p.description,
                (ci.current_quantity * p.unit_price) AS inventory_value
            FROM 
                current_inventory ci
            JOIN
                products p ON ci.product_id = p.product_id
            WHERE
                ci.product_id = $1
        `;
        
        const productResult = await pool.query(productQuery, [id]);
        
        if (productResult.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        // Get recent stock movements for this product
        const movementsQuery = `
            SELECT
                movement_id,
                movement_type,
                quantity,
                unit_price,
                notes,
                created_at
            FROM
                stock_movements
            WHERE
                product_id = $1
            ORDER BY
                created_at DESC
            LIMIT 10
        `;
        
        const movementsResult = await pool.query(movementsQuery, [id]);
        
        // Calculate some statistics
        const totalIn = movementsResult.rows
            .filter(m => m.movement_type === 'STOCK_IN')
            .reduce((sum, m) => sum + parseInt(m.quantity), 0);
            
        const totalOut = movementsResult.rows
            .filter(m => m.movement_type !== 'STOCK_IN')
            .reduce((sum, m) => sum + parseInt(m.quantity), 0);
        
        // Prepare response
        const productInventory = {
            product: productResult.rows[0],
            inventory_status: {
                current_quantity: productResult.rows[0].current_quantity,
                inventory_value: productResult.rows[0].inventory_value,
                is_in_stock: productResult.rows[0].current_quantity > 0
            },
            movement_summary: {
                total_in: totalIn,
                total_out: totalOut,
                net_change: totalIn - totalOut
            },
            recent_movements: movementsResult.rows
        };
        
        res.json(productInventory);
    } catch (error) {
        console.error('Error fetching product inventory:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * @swagger
 * /api/inventory/alerts:
 *   get:
 *     summary: Get inventory alerts
 *     description: Returns low stock and out of stock items
 *     tags: [Inventory]
 *     parameters:
 *       - in: query
 *         name: threshold
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Threshold for low stock alerts
 *     responses:
 *       200:
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 threshold:
 *                   type: integer
 *                 total_alerts:
 *                   type: integer
 *                 out_of_stock_count:
 *                   type: integer
 *                 low_stock_count:
 *                   type: integer
 *                 out_of_stock:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AlertItem'
 *                 low_stock:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AlertItem'
 *       500:
 *         description: Internal server error
 */
export const getInventoryAlerts = async (req, res) => {
    try {
        const threshold = req.query.threshold || 10; // Default threshold of 10
        
        const alertsQuery = `
            SELECT 
                ci.product_id,
                ci.name,
                ci.sku,
                ci.category,
                ci.current_quantity,
                p.unit_price,
                CASE 
                    WHEN ci.current_quantity <= 0 THEN 'OUT_OF_STOCK'
                    WHEN ci.current_quantity <= $1 THEN 'LOW_STOCK'
                    ELSE 'NORMAL'
                END AS status
            FROM 
                current_inventory ci
            JOIN
                products p ON ci.product_id = p.product_id
            WHERE
                ci.current_quantity <= $1
            ORDER BY
                ci.current_quantity ASC, ci.category, ci.name
        `;
        
        const alertsResult = await pool.query(alertsQuery, [threshold]);
        
        // Group alerts by status
        const outOfStock = alertsResult.rows.filter(item => item.status === 'OUT_OF_STOCK');
        const lowStock = alertsResult.rows.filter(item => item.status === 'LOW_STOCK');
        
        // Prepare response
        const alerts = {
            threshold: parseInt(threshold),
            total_alerts: alertsResult.rows.length,
            out_of_stock_count: outOfStock.length,
            low_stock_count: lowStock.length,
            out_of_stock: outOfStock,
            low_stock: lowStock
        };
        
        res.json(alerts);
    } catch (error) {
        console.error('Error fetching inventory alerts:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * @swagger
 * /api/inventory/value:
 *   get:
 *     summary: Get inventory value report
 *     description: Returns inventory value breakdown by category
 *     tags: [Inventory]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by product category
 *     responses:
 *       200:
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total_inventory_value:
 *                   type: string
 *                 category_count:
 *                   type: integer
 *                 category_breakdown:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       category:
 *                         type: string
 *                       total_quantity:
 *                         type: integer
 *                       total_value:
 *                         type: number
 *                       product_count:
 *                         type: integer
 *       500:
 *         description: Internal server error
 */
export const getInventoryValue = async (req, res) => {
    try {
        const { category } = req.query;
        
        let queryText = `
            SELECT 
                ci.category,
                SUM(ci.current_quantity) AS total_quantity,
                SUM(ci.current_quantity * p.unit_price) AS total_value,
                COUNT(ci.product_id) AS product_count
            FROM 
                current_inventory ci
            JOIN
                products p ON ci.product_id = p.product_id
        `;
        
        const values = [];
        
        // Add category filter if provided
        if (category) {
            queryText += ` WHERE ci.category = $1`;
            values.push(category);
        }
        
        queryText += `
            GROUP BY 
                ci.category
            ORDER BY 
                total_value DESC
        `;
        
        const result = await pool.query(queryText, values);
        
        // Calculate grand total
        const grandTotal = result.rows.reduce((sum, item) => sum + parseFloat(item.total_value || 0), 0);
        
        // Prepare response
        const inventoryValue = {
            total_inventory_value: grandTotal.toFixed(2),
            category_count: result.rows.length,
            category_breakdown: result.rows
        };
        
        res.json(inventoryValue);
    } catch (error) {
        console.error('Error fetching inventory value:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * @swagger
 * components:
 *   schemas:
 *     AlertItem:
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
 *         current_quantity:
 *           type: integer
 *         unit_price:
 *           type: number
 *         status:
 *           type: string
 *           enum: [OUT_OF_STOCK, LOW_STOCK, NORMAL]
 */