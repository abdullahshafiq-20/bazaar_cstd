import pool from '../config/pool.js';


export const assignStoreToManager = async (req, res) => {
    try {
      const { userId, storeId } = req.body;
      
      // Validate required fields
      if (!userId || !storeId) {
        return res.status(400).json({
          success: false,
          message: 'User ID and Store ID are required'
        });
      }
      
      // Check user roles
      const userRoles = await pool.query(
        'SELECT role FROM user_roles WHERE user_id = $1',
        [userId]
      );
      
      // If no roles found, user doesn't exist in user_roles table
      if (userRoles.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User has no assigned roles'
        });
      }
      
      // Check if user is a store manager
      const isStoreManager = userRoles.rows.some(row => row.role === 'STORE_MANAGER');
      const isAdmin = userRoles.rows.some(row => row.role === 'ADMIN');
      
      if (isAdmin && !isStoreManager) {
        return res.status(403).json({
          success: false,
          message: 'Admin users cannot be assigned to manage specific stores'
        });
      }
      
      if (!isStoreManager) {
        return res.status(403).json({
          success: false,
          message: 'User must have STORE_MANAGER role to be assigned to a store'
        });
      }
      
      // Begin transaction
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');
        
        // Verify user exists and is active
        const userCheck = await client.query(
          'SELECT * FROM users WHERE user_id = $1 AND is_active = true',
          [userId]
        );
        
        if (userCheck.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(404).json({
            success: false,
            message: 'User not found or is inactive'
          });
        }
        
        // Verify store exists and is active
        const storeCheck = await client.query(
          'SELECT * FROM stores WHERE store_id = $1 AND is_active = true',
          [storeId]
        );
        
        if (storeCheck.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(404).json({
            success: false,
            message: 'Store not found or is inactive'
          });
        }
        
        // Check if user already has STORE_MANAGER role for this store
        const existingRoleCheck = await client.query(
          'SELECT * FROM user_roles WHERE user_id = $1 AND store_id = $2 AND role = $3',
          [userId, storeId, 'STORE_MANAGER']
        );
        
        if (existingRoleCheck.rows.length > 0) {
          await client.query('ROLLBACK');
          return res.status(409).json({
            success: false,
            message: 'User is already assigned as manager for this store'
          });
        }
        
        // Assign store manager role
        const result = await client.query(
          'INSERT INTO user_roles (user_id, store_id, role) VALUES ($1, $2, $3) RETURNING *',
          [userId, storeId, 'STORE_MANAGER']
        );
        
        await client.query('COMMIT');
        
        // Get user and store details for response
        const userData = await pool.query(
          'SELECT user_id, username, email, full_name FROM users WHERE user_id = $1',
          [userId]
        );
        
        const storeData = await pool.query(
          'SELECT store_id, name, address FROM stores WHERE store_id = $1',
          [storeId]
        );
        
        res.status(201).json({
          success: true,
          message: 'Store successfully assigned to manager',
          data: {
            assignment: result.rows[0],
            user: userData.rows[0],
            store: storeData.rows[0]
          }
        });
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error assigning store to manager:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  };


export const removeStoreAssignment = async (req, res) => {
  try {
    const { userId, storeId } = req.params;
    
    // Check if the assignment exists
    const checkResult = await pool.query(
      'SELECT * FROM user_roles WHERE user_id = $1 AND store_id = $2 AND role = $3',
      [userId, storeId, 'STORE_MANAGER']
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Store assignment not found'
      });
    }
    
    // Remove the assignment
    const result = await pool.query(
      'DELETE FROM user_roles WHERE user_id = $1 AND store_id = $2 AND role = $3 RETURNING *',
      [userId, storeId, 'STORE_MANAGER']
    );
    
    res.status(200).json({
      success: true,
      message: 'Store assignment removed successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error removing store assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};


export const getAllStoreManagers = async (req, res) => {
  try {
    const { unassigned } = req.query;
    
    let query = `
      SELECT u.user_id, u.username, u.email, u.full_name, u.is_active, 
             array_agg(DISTINCT s.store_id) FILTER (WHERE s.store_id IS NOT NULL) as managed_stores,
             array_agg(DISTINCT s.name) FILTER (WHERE s.name IS NOT NULL) as store_names
      FROM users u
      LEFT JOIN user_roles ur ON u.user_id = ur.user_id AND ur.role = 'STORE_MANAGER'
      LEFT JOIN stores s ON ur.store_id = s.store_id
      WHERE EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_roles.user_id = u.user_id 
        AND user_roles.role = 'STORE_MANAGER'
      )
    `;
    
    if (unassigned === 'true') {
      // Only get managers without any store assignments
      query = `
        SELECT u.user_id, u.username, u.email, u.full_name, u.is_active,
               NULL as managed_stores,
               NULL as store_names
        FROM users u
        JOIN user_roles ur ON u.user_id = ur.user_id AND ur.role = 'STORE_MANAGER'
        WHERE NOT EXISTS (
          SELECT 1 FROM user_roles 
          WHERE user_roles.user_id = u.user_id 
          AND user_roles.role = 'STORE_MANAGER'
          AND user_roles.store_id IS NOT NULL
        )
      `;
    }
    
    query += ` GROUP BY u.user_id, u.username, u.email, u.full_name, u.is_active
               ORDER BY u.full_name`;
    
    const result = await pool.query(query);
    
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


export const getManagerStores = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verify user exists
    const userCheck = await pool.query(
      'SELECT * FROM users WHERE user_id = $1',
      [userId]
    );
    
    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Get stores managed by this user
    const result = await pool.query(
      `SELECT s.store_id, s.name, s.address, s.phone, s.email, s.is_active
       FROM stores s
       JOIN user_roles ur ON s.store_id = ur.store_id
       WHERE ur.user_id = $1 AND ur.role = $2
       ORDER BY s.name`,
      [userId, 'STORE_MANAGER']
    );
    
    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
      user: {
        user_id: userCheck.rows[0].user_id,
        username: userCheck.rows[0].username,
        full_name: userCheck.rows[0].full_name
      }
    });
  } catch (error) {
    console.error('Error getting manager stores:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};


export const getUnassignedStores = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.store_id, s.name, s.address, s.phone, s.email, s.is_active
       FROM stores s
       WHERE s.is_active = true AND NOT EXISTS (
         SELECT 1 FROM user_roles ur 
         WHERE ur.store_id = s.store_id AND ur.role = 'STORE_MANAGER'
       )
       ORDER BY s.name`
    );
    
    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Error getting unassigned stores:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export const getAllAssignedStores = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.store_id, s.name, s.address, s.phone, s.email, s.is_active
       FROM stores s
       WHERE s.is_active = true AND EXISTS (
         SELECT 1 FROM user_roles ur 
         WHERE ur.store_id = s.store_id AND ur.role = 'STORE_MANAGER'
       )
       ORDER BY s.name`
    );
    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Error getting unassigned stores:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};  

