import pool from '../config/pool.js';

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