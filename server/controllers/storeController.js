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