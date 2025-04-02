import pool from '../config/pool.js';

/**
 * Add stock to a specific store
 */
export const addStock = async (req, res) => {
    try {
        const storeId = parseInt(req.params.id); // Get store ID from URL
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
        
        // Check if store exists
        const storeQuery = 'SELECT * FROM stores WHERE store_id = $1';
        const storeResult = await pool.query(storeQuery, [storeId]);
        
        if (storeResult.rows.length === 0) {
            return res.status(404).json({ error: 'Store not found' });
        }
        
        // Insert stock movement record with store_id
        const insertQuery = `
            INSERT INTO stock_movements (product_id, store_id, movement_type, quantity, unit_price, notes)
            VALUES ($1, $2, 'STOCK_IN', $3, $4, $5)
            RETURNING movement_id, product_id, store_id, movement_type, quantity, unit_price, notes, created_at
        `;
        
        const values = [
            product_id,
            storeId,
            quantity,
            unit_price || productResult.rows[0].unit_price, // Use provided price or product's price
            notes || 'Stock addition'
        ];
        
        const result = await pool.query(insertQuery, values);
        
        // Get updated stock level for this product at this store
        const stockQuery = `
            SELECT COALESCE(SUM(
                CASE WHEN movement_type = 'STOCK_IN' THEN quantity
                     ELSE -quantity END
            ), 0) AS current_stock
            FROM stock_movements
            WHERE product_id = $1 AND store_id = $2
        `;
        
        const stockResult = await pool.query(stockQuery, [product_id, storeId]);
        
        res.status(201).json({
            message: 'Stock added successfully',
            movement: result.rows[0],
            currentStock: parseInt(stockResult.rows[0].current_stock)
        });
    } catch (error) {
        console.error('Error adding stock:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Record a sale for a specific store
 */
export const recordSale = async (req, res) => {
    try {
        const storeId = parseInt(req.params.id); // Get store ID from URL
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
        
        // Check current stock level at this store
        const stockQuery = `
            SELECT COALESCE(SUM(
                CASE WHEN movement_type = 'STOCK_IN' THEN quantity
                     ELSE -quantity END
            ), 0) AS current_stock
            FROM stock_movements
            WHERE product_id = $1 AND store_id = $2
        `;
        
        const stockResult = await pool.query(stockQuery, [product_id, storeId]);
        const currentStock = parseInt(stockResult.rows[0].current_stock);
        
        if (currentStock < quantity) {
            return res.status(400).json({ 
                error: 'Insufficient stock at this store',
                store: storeId,
                currentStock,
                requestedQuantity: quantity
            });
        }
        
        // Insert sale movement record with store_id
        const insertQuery = `
            INSERT INTO stock_movements (product_id, store_id, movement_type, quantity, unit_price, notes)
            VALUES ($1, $2, 'SALE', $3, $4, $5)
            RETURNING movement_id, product_id, store_id, movement_type, quantity, unit_price, notes, created_at
        `;
        
        const values = [
            product_id,
            storeId,
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
 * Manual removal of stock from a specific store
 */
export const manualRemoval = async (req, res) => {
    try {
        const storeId = parseInt(req.params.id); // Get store ID from URL
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
        
        // Check current stock level at this store
        const stockQuery = `
            SELECT COALESCE(SUM(
                CASE WHEN movement_type = 'STOCK_IN' THEN quantity
                     ELSE -quantity END
            ), 0) AS current_stock
            FROM stock_movements
            WHERE product_id = $1 AND store_id = $2
        `;
        
        const stockResult = await pool.query(stockQuery, [product_id, storeId]);
        const currentStock = parseInt(stockResult.rows[0].current_stock);
        
        if (currentStock < quantity) {
            return res.status(400).json({ 
                error: 'Insufficient stock at this store',
                store: storeId,
                currentStock,
                requestedQuantity: quantity
            });
        }
        
        // Insert manual removal record with store_id
        const insertQuery = `
            INSERT INTO stock_movements (product_id, store_id, movement_type, quantity, unit_price, notes)
            VALUES ($1, $2, 'MANUAL_REMOVAL', $3, $4, $5)
            RETURNING movement_id, product_id, store_id, movement_type, quantity, unit_price, notes, created_at
        `;
        
        const values = [
            product_id,
            storeId,
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
 * Get stock movements for a specific store with optional filters
 */
export const getStoreStockMovements = async (req, res) => {
    try {
        const storeId = parseInt(req.params.id); // Get store ID from URL
        const { product_id, movement_type, start_date, end_date } = req.query;
        
        let queryConditions = [`sm.store_id = $1`]; // Always filter by store_id
        let values = [storeId];
        let paramIndex = 2;
        
        // Base query with join to get product names
        let queryText = `
            SELECT sm.movement_id, sm.product_id, p.name as product_name, 
                   sm.store_id, sm.movement_type, sm.quantity, sm.unit_price, 
                   sm.notes, sm.created_at
            FROM stock_movements sm
            JOIN products p ON sm.product_id = p.product_id
            WHERE sm.store_id = $1
        `;
        
        // Add additional filters if provided
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
        
        // Update the WHERE clause with all conditions
        if (queryConditions.length > 1) {
            queryText = `
                SELECT sm.movement_id, sm.product_id, p.name as product_name, 
                       sm.store_id, sm.movement_type, sm.quantity, sm.unit_price, 
                       sm.notes, sm.created_at
                FROM stock_movements sm
                JOIN products p ON sm.product_id = p.product_id
                WHERE ${queryConditions.join(' AND ')}
            `;
        }
        
        // Add sorting
        queryText += ` ORDER BY sm.created_at DESC`;
        
        const result = await pool.query(queryText, values);
        
        res.status(200).json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching stock movements:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Get current stock levels for a specific store
 */
export const getStoreInventory = async (req, res) => {
    try {
        const storeId = parseInt(req.params.id); // Get store ID from URL
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
            LEFT JOIN stock_movements sm ON p.product_id = sm.product_id AND sm.store_id = $1
            WHERE 1=1
        `;
        
        const values = [storeId];
        let paramIndex = 2;
        
        // Add category filter if provided
        if (category) {
            queryText += ` AND p.category = $${paramIndex}`;
            values.push(category);
            paramIndex++;
        }
        
        queryText += `
            GROUP BY p.product_id, p.name, p.sku, p.category, p.unit_price
            HAVING COALESCE(SUM(
                CASE WHEN sm.movement_type = 'STOCK_IN' THEN sm.quantity
                     ELSE -sm.quantity END
            ), 0) > 0
            ORDER BY p.category, p.name
        `;
        
        const result = await pool.query(queryText, values);
        
        // Get store information
        const storeQuery = 'SELECT * FROM stores WHERE store_id = $1';
        const storeResult = await pool.query(storeQuery, [storeId]);
        
        if (storeResult.rows.length === 0) {
            return res.status(404).json({ error: 'Store not found' });
        }
        
        res.status(200).json({
            success: true,
            store: {
                id: storeId,
                name: storeResult.rows[0].name
            },
            count: result.rows.length,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching store inventory:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Get inventory value for a store
 */
export const getStoreInventoryValue = async (req, res) => {
    try {
        const storeId = parseInt(req.params.id);
        
        // Calculate total inventory value
        const valueQuery = `
            SELECT 
                p.category,
                SUM(
                    COALESCE(
                        (SELECT SUM(CASE 
                            WHEN movement_type = 'STOCK_IN' THEN quantity 
                            ELSE -quantity
                        END) 
                        FROM stock_movements 
                        WHERE product_id = p.product_id AND store_id = $1),
                        0
                    ) * p.unit_price
                ) AS value,
                COUNT(DISTINCT p.product_id) AS product_count,
                SUM(
                    COALESCE(
                        (SELECT SUM(CASE 
                            WHEN movement_type = 'STOCK_IN' THEN quantity 
                            ELSE -quantity
                        END) 
                        FROM stock_movements 
                        WHERE product_id = p.product_id AND store_id = $1),
                        0
                    )
                ) AS total_units
            FROM products p
            JOIN (
                SELECT DISTINCT product_id 
                FROM stock_movements 
                WHERE store_id = $1
                GROUP BY product_id
                HAVING SUM(CASE 
                    WHEN movement_type = 'STOCK_IN' THEN quantity 
                    ELSE -quantity
                END) > 0
            ) active_products ON p.product_id = active_products.product_id
            GROUP BY p.category
            ORDER BY value DESC
        `;
        
        const valueResult = await pool.query(valueQuery, [storeId]);
        
        // Calculate grand total
        const totalQuery = `
            SELECT 
                SUM(
                    COALESCE(
                        (SELECT SUM(CASE 
                            WHEN movement_type = 'STOCK_IN' THEN quantity 
                            ELSE -quantity
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
                            ELSE -quantity
                        END) 
                        FROM stock_movements 
                        WHERE product_id = p.product_id AND store_id = $1),
                        0
                    )
                ) AS total_units
            FROM products p
            JOIN (
                SELECT DISTINCT product_id 
                FROM stock_movements 
                WHERE store_id = $1
                GROUP BY product_id
                HAVING SUM(CASE 
                    WHEN movement_type = 'STOCK_IN' THEN quantity 
                    ELSE -quantity
                END) > 0
            ) active_products ON p.product_id = active_products.product_id
        `;
        
        const totalResult = await pool.query(totalQuery, [storeId]);
        
        // Get store information
        const storeQuery = 'SELECT * FROM stores WHERE store_id = $1';
        const storeResult = await pool.query(storeQuery, [storeId]);
        
        if (storeResult.rows.length === 0) {
            return res.status(404).json({ error: 'Store not found' });
        }
        
        res.status(200).json({
            success: true,
            store: {
                id: storeId,
                name: storeResult.rows[0].name
            },
            total: totalResult.rows[0],
            by_category: valueResult.rows
        });
    } catch (error) {
        console.error('Error calculating inventory value:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Transfer stock between stores
 */
export const transferStock = async (req, res) => {
    try {
        const { source_store_id, target_store_id, product_id, quantity, notes } = req.body;
        
        // Input validation
        if (!source_store_id || !target_store_id || !product_id || !quantity) {
            return res.status(400).json({ 
                error: 'Source store ID, target store ID, product ID, and quantity are required' 
            });
        }
        
        if (source_store_id === target_store_id) {
            return res.status(400).json({ 
                error: 'Source and target stores must be different' 
            });
        }
        
        if (quantity <= 0) {
            return res.status(400).json({ error: 'Quantity must be greater than zero' });
        }
        
        // Begin transaction
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            // Check if product exists
            const productQuery = 'SELECT * FROM products WHERE product_id = $1';
            const productResult = await client.query(productQuery, [product_id]);
            
            if (productResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'Product not found' });
            }
            
            // Check if stores exist
            const storesQuery = 'SELECT store_id, name FROM stores WHERE store_id IN ($1, $2)';
            const storesResult = await client.query(storesQuery, [source_store_id, target_store_id]);
            
            if (storesResult.rows.length !== 2) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'One or both stores not found' });
            }
            
            // Check current stock level at source store
            const stockQuery = `
                SELECT COALESCE(SUM(
                    CASE WHEN movement_type = 'STOCK_IN' THEN quantity
                         ELSE -quantity END
                ), 0) AS current_stock
                FROM stock_movements
                WHERE product_id = $1 AND store_id = $2
            `;
            
            const stockResult = await client.query(stockQuery, [product_id, source_store_id]);
            const currentStock = parseInt(stockResult.rows[0].current_stock);
            
            if (currentStock < quantity) {
                await client.query('ROLLBACK');
                return res.status(400).json({ 
                    error: 'Insufficient stock at source store',
                    store: source_store_id,
                    currentStock,
                    requestedQuantity: quantity
                });
            }
            
            // Record removal from source store
            const removalQuery = `
                INSERT INTO stock_movements 
                (product_id, store_id, movement_type, quantity, unit_price, notes)
                VALUES ($1, $2, 'MANUAL_REMOVAL', $3, $4, $5)
                RETURNING movement_id
            `;
            
            const removalValues = [
                product_id,
                source_store_id,
                quantity,
                productResult.rows[0].unit_price,
                notes || `Transfer to store ${target_store_id}`
            ];
            
            await client.query(removalQuery, removalValues);
            
            // Record addition to target store
            const additionQuery = `
                INSERT INTO stock_movements 
                (product_id, store_id, movement_type, quantity, unit_price, notes)
                VALUES ($1, $2, 'STOCK_IN', $3, $4, $5)
                RETURNING movement_id
            `;
            
            const additionValues = [
                product_id,
                target_store_id,
                quantity,
                productResult.rows[0].unit_price,
                notes || `Transfer from store ${source_store_id}`
            ];
            
            await client.query(additionQuery, additionValues);
            
            // Get updated stock levels
            const sourceResult = await client.query(stockQuery, [product_id, source_store_id]);
            const targetResult = await client.query(stockQuery, [product_id, target_store_id]);
            
            await client.query('COMMIT');
            
            res.status(200).json({
                message: 'Stock transferred successfully',
                product: {
                    id: product_id,
                    name: productResult.rows[0].name
                },
                quantity: quantity,
                source_store: {
                    id: source_store_id,
                    remaining_stock: parseInt(sourceResult.rows[0].current_stock)
                },
                target_store: {
                    id: target_store_id,
                    current_stock: parseInt(targetResult.rows[0].current_stock)
                }
            });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error transferring stock:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};