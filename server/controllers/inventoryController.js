import pool from '../config/pool.js';


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
 * Get inventory for a specific product in a store
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
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
 * Remove product from inventory
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
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
 * Get inventory alerts for low stock or out of stock items
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getInventoryAlerts = async (req, res) => {
  try {
    const storeId = parseInt(req.params.id);
    const lowStockThreshold = parseInt(req.query.threshold || 10);
    
    // Get products with low or zero inventory
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
 * Get the total value of inventory in a store
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
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