import pool from '../config/pool.js';


export const getAllStores = async (req, res) => {
  try {
    // Get optional query parameters for filtering
    const { name, isActive } = req.query;
    
    let query = 'SELECT * FROM stores';
    const queryParams = [];
    const conditions = [];
    
    // Build dynamic query based on filters
    if (name) {
      queryParams.push(`%${name}%`);
      conditions.push(`name ILIKE $${queryParams.length}`);
    }
    
    if (isActive !== undefined) {
      queryParams.push(isActive === 'true');
      conditions.push(`is_active = $${queryParams.length}`);
    }
    
    // Add WHERE clause if we have conditions
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    // Add sorting
    query += ' ORDER BY name ASC';
    
    const result = await pool.query(query, queryParams);
    
    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Error getting stores:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};


export const getStoreById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM stores WHERE store_id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }
    
    // Get the count of managers for this store
    const managersCount = await pool.query(
      'SELECT COUNT(*) FROM user_roles WHERE store_id = $1 AND role = $2',
      [id, 'STORE_MANAGER']
    );
    
    // Get the product count for this store
    const productCount = await pool.query(
      'SELECT COUNT(DISTINCT product_id) FROM stock_movements WHERE store_id = $1',
      [id]
    );
    
    const storeData = {
      ...result.rows[0],
      managersCount: parseInt(managersCount.rows[0].count),
      productCount: parseInt(productCount.rows[0].count)
    };
    
    res.status(200).json({
      success: true,
      data: storeData
    });
  } catch (error) {
    console.error('Error getting store:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};


export const createStore = async (req, res) => {
  try {
    const { name, address, phone, email, is_active } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Store name is required'
      });
    }
    
    // Validate email format if provided
    if (email && !isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }
    
    // Insert new store
    const result = await pool.query(
      'INSERT INTO stores (name, address, phone, email, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, address, phone, email, is_active !== undefined ? is_active : true]
    );
    
    res.status(201).json({
      success: true,
      message: 'Store created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating store:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};


export const updateStore = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, phone, email, is_active } = req.body;
    
    // Check if store exists
    const checkResult = await pool.query(
      'SELECT * FROM stores WHERE store_id = $1',
      [id]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Store name is required'
      });
    }
    
    // Validate email format if provided
    if (email && !isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }
    
    // Update store
    const result = await pool.query(
      `UPDATE stores 
       SET name = $1, address = $2, phone = $3, email = $4, is_active = $5, updated_at = CURRENT_TIMESTAMP
       WHERE store_id = $6
       RETURNING *`,
      [name, address, phone, email, is_active, id]
    );
    
    res.status(200).json({
      success: true,
      message: 'Store updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating store:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};


export const deleteStore = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Begin transaction as we need to check dependencies before deleting
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Check if store has any stock movements
      const stockCheck = await client.query(
        'SELECT COUNT(*) FROM stock_movements WHERE store_id = $1',
        [id]
      );
      
      if (parseInt(stockCheck.rows[0].count) > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: 'Cannot delete store with existing inventory movements. Deactivate it instead.'
        });
      }
      
      // Check if store has any assigned users
      const userCheck = await client.query(
        'SELECT COUNT(*) FROM user_roles WHERE store_id = $1',
        [id]
      );
      
      if (parseInt(userCheck.rows[0].count) > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: 'Cannot delete store with assigned users. Deactivate it instead.'
        });
      }
      
      // If no dependencies, proceed with deletion
      const result = await client.query(
        'DELETE FROM stores WHERE store_id = $1 RETURNING *',
        [id]
      );
      
      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'Store not found'
        });
      }
      
      await client.query('COMMIT');
      
      res.status(200).json({
        success: true,
        message: 'Store deleted successfully',
        data: result.rows[0]
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error deleting store:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};


export const toggleStoreStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    
    // Validate input
    if (is_active === undefined) {
      return res.status(400).json({
        success: false,
        message: 'is_active field is required'
      });
    }
    
    const result = await pool.query(
      'UPDATE stores SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE store_id = $2 RETURNING *',
      [is_active, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: `Store ${is_active ? 'activated' : 'deactivated'} successfully`,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating store status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};


export const getStoreManagers = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if store exists
    const storeCheck = await pool.query(
      'SELECT * FROM stores WHERE store_id = $1',
      [id]
    );
    
    if (storeCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }
    
    // Get all managers for the store
    const result = await pool.query(
      `SELECT u.user_id, u.username, u.email, u.full_name, u.is_active, ur.role
       FROM users u
       JOIN user_roles ur ON u.user_id = ur.user_id
       WHERE ur.store_id = $1 AND ur.role = $2
       ORDER BY u.full_name`,
      [id, 'STORE_MANAGER']
    );
    
    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Error getting store managers:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};


const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const getStoreFullDetails = async (req, res) => {
  const { id } = req.params;
  const { startDate, endDate } = req.dateFilter || {
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Default last 30 days
    endDate: new Date()
  };

  try {
    // Format dates for SQL queries
    const formattedStartDate = startDate.toISOString().split('T')[0];
    const formattedEndDate = endDate.toISOString().split('T')[0];

    // Get basic store information
    const storeQuery = await pool.query(
      'SELECT * FROM stores WHERE store_id = $1',
      [id]
    );

    if (storeQuery.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    const store = storeQuery.rows[0];

    // Get store managers
    const managersQuery = await pool.query(
      `SELECT u.user_id, u.username, u.email, u.full_name, u.is_active
       FROM users u
       JOIN user_roles ur ON u.user_id = ur.user_id
       WHERE ur.store_id = $1 AND ur.role = 'STORE_MANAGER'`,
      [id]
    );

    // Get inventory summary with current value
    const inventoryQuery = await pool.query(
      `SELECT 
        p.product_id,
        p.name AS product_name,
        p.sku,
        COALESCE(SUM(CASE 
          WHEN sm.movement_type = 'STOCK_IN' THEN sm.quantity
          WHEN sm.movement_type IN ('SALE', 'MANUAL_REMOVAL') THEN -sm.quantity
          ELSE 0
        END), 0) AS quantity,
        p.unit_price,
        COALESCE(SUM(CASE 
          WHEN sm.movement_type = 'STOCK_IN' THEN sm.quantity
          WHEN sm.movement_type IN ('SALE', 'MANUAL_REMOVAL') THEN -sm.quantity
          ELSE 0
        END), 0) * p.unit_price AS total_value
       FROM products p
       LEFT JOIN stock_movements sm ON p.product_id = sm.product_id
       WHERE sm.store_id = $1
       GROUP BY p.product_id, p.name, p.sku, p.unit_price
       HAVING COALESCE(SUM(CASE 
          WHEN sm.movement_type = 'STOCK_IN' THEN sm.quantity
          WHEN sm.movement_type IN ('SALE', 'MANUAL_REMOVAL') THEN -sm.quantity
          ELSE 0
        END), 0) > 0`,
      [id]
    );

    // Calculate total inventory value
    const totalInventoryValue = inventoryQuery.rows.reduce(
      (sum, item) => sum + parseFloat(item.total_value || 0),
      0
    );

    // Get stock movement history filtered by date range
    const stockMovementsQuery = await pool.query(
      `SELECT 
        sm.movement_id,
        sm.created_at AS movement_date,
        sm.movement_type,
        sm.quantity,
        p.name AS product_name,
        p.sku,
        u.username AS created_by
       FROM stock_movements sm
       JOIN products p ON sm.product_id = p.product_id
       JOIN users u ON u.user_id = (SELECT user_id FROM user_roles WHERE store_id = $1 LIMIT 1)
       WHERE sm.store_id = $1
         AND sm.created_at BETWEEN $2 AND $3
       ORDER BY sm.created_at DESC`,
      [id, formattedStartDate, formattedEndDate]
    );

    // Get top selling products
    const topSellingQuery = await pool.query(
      `SELECT 
        p.product_id,
        p.name,
        p.sku,
        SUM(sm.quantity) AS total_sold
       FROM stock_movements sm
       JOIN products p ON sm.product_id = p.product_id
       WHERE sm.store_id = $1
         AND sm.movement_type = 'SALE'
         AND sm.created_at BETWEEN $2 AND $3
       GROUP BY p.product_id, p.name, p.sku
       ORDER BY total_sold DESC
       LIMIT 10`,
      [id, formattedStartDate, formattedEndDate]
    );

    // Get low stock items - using view or calculated directly
    const lowStockQuery = await pool.query(
      `SELECT 
        p.product_id,
        p.name,
        p.sku,
        COALESCE(SUM(CASE 
          WHEN sm.movement_type = 'STOCK_IN' THEN sm.quantity
          WHEN sm.movement_type IN ('SALE', 'MANUAL_REMOVAL') THEN -sm.quantity
          ELSE 0
        END), 0) AS quantity
       FROM products p
       LEFT JOIN stock_movements sm ON p.product_id = sm.product_id
       WHERE sm.store_id = $1
       GROUP BY p.product_id, p.name, p.sku
       HAVING COALESCE(SUM(CASE 
          WHEN sm.movement_type = 'STOCK_IN' THEN sm.quantity
          WHEN sm.movement_type IN ('SALE', 'MANUAL_REMOVAL') THEN -sm.quantity
          ELSE 0
        END), 0) <= 10`, // Using 10 as a default threshold
      [id]
    );

    // Compile all data into a comprehensive report
    const storeDetails = {
      success: true,
      storeInfo: store,
      dateRange: {
        startDate: formattedStartDate,
        endDate: formattedEndDate
      },
      managers: {
        count: managersQuery.rows.length,
        data: managersQuery.rows
      },
      inventorySummary: {
        totalValue: Number(totalInventoryValue).toFixed(2),
        itemCount: inventoryQuery.rows.length,
        items: inventoryQuery.rows
      },
      stockMovements: {
        count: stockMovementsQuery.rows.length,
        data: stockMovementsQuery.rows
      },
      topSellingProducts: {
        count: topSellingQuery.rows.length,
        data: topSellingQuery.rows
      },
      lowStockItems: {
        count: lowStockQuery.rows.length,
        data: lowStockQuery.rows
      }
    };

    res.status(200).json(storeDetails);
  } catch (error) {
    console.error('Error fetching store details:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching store details'
    });
  }
};

export const getAllStoresFullDetails = async (req, res) => {
  const { startDate, endDate } = req.dateFilter || {
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Default last 30 days
    endDate: new Date()
  };

  try {
    // Format dates for SQL queries
    const formattedStartDate = startDate.toISOString().split('T')[0];
    const formattedEndDate = endDate.toISOString().split('T')[0];

    // Get all active stores
    const storesQuery = await pool.query(
      'SELECT * FROM stores WHERE is_active = $1 ORDER BY name',
      [true]
    );

    const storesData = [];

    // For each store, gather relevant data
    for (const store of storesQuery.rows) {
      // Get inventory value for this store - fixed nested aggregation
      const inventoryValueQuery = await pool.query(
        `SELECT 
          SUM(current_value) AS total_value
         FROM (
           SELECT 
             p.product_id,
             COALESCE(SUM(CASE 
               WHEN sm.movement_type = 'STOCK_IN' THEN sm.quantity
               WHEN sm.movement_type IN ('SALE', 'MANUAL_REMOVAL') THEN -sm.quantity
               ELSE 0
             END), 0) * p.unit_price AS current_value
           FROM products p
           LEFT JOIN stock_movements sm ON p.product_id = sm.product_id
           WHERE sm.store_id = $1
           GROUP BY p.product_id, p.unit_price
           HAVING COALESCE(SUM(CASE 
             WHEN sm.movement_type = 'STOCK_IN' THEN sm.quantity
             WHEN sm.movement_type IN ('SALE', 'MANUAL_REMOVAL') THEN -sm.quantity
             ELSE 0
           END), 0) > 0
         ) AS inventory_values`,
        [store.store_id]
      );

      // Get product count for this store - fixed by using a subquery
      const productCountQuery = await pool.query(
        `SELECT COUNT(*) AS product_count
         FROM (
           SELECT p.product_id
           FROM products p
           JOIN stock_movements sm ON p.product_id = sm.product_id
           WHERE sm.store_id = $1
           GROUP BY p.product_id
           HAVING COALESCE(SUM(CASE 
             WHEN sm.movement_type = 'STOCK_IN' THEN sm.quantity
             WHEN sm.movement_type IN ('SALE', 'MANUAL_REMOVAL') THEN -sm.quantity
             ELSE 0
           END), 0) > 0
         ) AS products_with_stock`,
        [store.store_id]
      );

      // Get total sales for this store in date range
      const salesQuery = await pool.query(
        `SELECT 
           COUNT(DISTINCT movement_id) AS transaction_count, 
           SUM(quantity * unit_price) AS total_sales
         FROM stock_movements
         WHERE store_id = $1 
           AND movement_type = 'SALE'
           AND created_at BETWEEN $2 AND $3`,
        [store.store_id, formattedStartDate, formattedEndDate]
      );

      // Get manager count
      const managerCountQuery = await pool.query(
        `SELECT COUNT(*) AS manager_count
         FROM user_roles
         WHERE store_id = $1 AND role = 'STORE_MANAGER'`,
        [store.store_id]
      );

      // Get low stock count - fixed by using a subquery
      const lowStockQuery = await pool.query(
        `SELECT COUNT(*) AS low_stock_count
         FROM (
           SELECT p.product_id
           FROM products p
           JOIN stock_movements sm ON p.product_id = sm.product_id
           WHERE sm.store_id = $1
           GROUP BY p.product_id
           HAVING COALESCE(SUM(CASE 
             WHEN sm.movement_type = 'STOCK_IN' THEN sm.quantity
             WHEN sm.movement_type IN ('SALE', 'MANUAL_REMOVAL') THEN -sm.quantity
             ELSE 0
           END), 0) <= 10
         ) AS low_stock_products`,
        [store.store_id]
      );

      storesData.push({
        id: store.store_id,
        name: store.name,
        address: store.address,
        phone: store.phone,
        email: store.email,
        isActive: store.is_active,
        inventoryValue: Number(inventoryValueQuery.rows[0]?.total_value || 0).toFixed(2),
        productCount: Number(productCountQuery.rows[0]?.product_count || 0),
        salesData: {
          transactionCount: Number(salesQuery.rows[0]?.transaction_count || 0),
          totalSales: Number(salesQuery.rows[0]?.total_sales || 0).toFixed(2)
        },
        managerCount: Number(managerCountQuery.rows[0]?.manager_count || 0),
        lowStockCount: Number(lowStockQuery.rows[0]?.low_stock_count || 0)
      });
    }

    res.status(200).json({
      success: true,
      dateRange: {
        startDate: formattedStartDate,
        endDate: formattedEndDate
      },
      storesCount: storesData.length,
      stores: storesData
    });
  } catch (error) {
    console.error('Error fetching all stores details:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching stores details'
    });
  }
};