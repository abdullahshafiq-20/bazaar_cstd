import pool from '../config/pool.js';

/**
 * Get overall inventory status with optional filtering
 * Returns a summary of current inventory for all products or filtered subset
 * 
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
 * Get detailed inventory for a specific product
 * Returns current quantity, recent movements, and value
 * 
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
 * Get inventory alerts (low stock, out of stock)
 * 
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
 * Get inventory value report
 * 
 * @param {Object} req - Request object with optional category parameter
 * @param {Object} res - Response object
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