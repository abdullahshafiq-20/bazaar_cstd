import pool from '../config/pool.js';

/**
 * @swagger
 * components:
 *   schemas:
 *     StoreAssignment:
 *       type: object
 *       properties:
 *         user_id:
 *           type: integer
 *           description: The ID of the manager user
 *         store_id:
 *           type: integer
 *           description: The ID of the store being assigned
 *         role:
 *           type: string
 *           enum: [STORE_MANAGER]
 *           description: The role assigned to the user for this store
 *       required:
 *         - user_id
 *         - store_id
 *         - role
 *     Manager:
 *       type: object
 *       properties:
 *         user_id:
 *           type: integer
 *           description: The user ID
 *         username:
 *           type: string
 *           description: Username
 *         email:
 *           type: string
 *           description: User email
 *         full_name:
 *           type: string
 *           description: User's full name
 *         is_active:
 *           type: boolean
 *           description: Whether the user account is active
 *         managed_stores:
 *           type: array
 *           items:
 *             type: integer
 *           description: Array of store IDs this manager is assigned to
 *         store_names:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of store names this manager is assigned to
 *     Store:
 *       type: object
 *       properties:
 *         store_id:
 *           type: integer
 *           description: The store ID
 *         name:
 *           type: string
 *           description: Store name
 *         address:
 *           type: string
 *           description: Store address
 *         phone:
 *           type: string
 *           description: Store phone number
 *         email:
 *           type: string
 *           description: Store email address
 *         is_active:
 *           type: boolean
 *           description: Whether the store is active
 */

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin operations for store management
 */

/**
 * @swagger
 * /api/admin/assignments:
 *   post:
 *     summary: Assign a store to a manager
 *     description: Assigns a specific store to a user with STORE_MANAGER role
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - storeId
 *             properties:
 *               userId:
 *                 type: integer
 *                 description: User ID of the manager
 *               storeId:
 *                 type: integer
 *                 description: ID of the store to assign
 *     responses:
 *       201:
 *         description: Store successfully assigned to manager
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
 *                   example: Store successfully assigned to manager
 *                 data:
 *                   type: object
 *                   properties:
 *                     assignment:
 *                       $ref: '#/components/schemas/StoreAssignment'
 *                     user:
 *                       type: object
 *                       properties:
 *                         user_id:
 *                           type: integer
 *                         username:
 *                           type: string
 *                         email:
 *                           type: string
 *                         full_name:
 *                           type: string
 *                     store:
 *                       type: object
 *                       properties:
 *                         store_id:
 *                           type: integer
 *                         name:
 *                           type: string
 *                         address:
 *                           type: string
 *       400:
 *         description: Bad request - Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: User ID and Store ID are required
 *       403:
 *         description: User is not a store manager or is an admin
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: User must have STORE_MANAGER role to be assigned to a store
 *       404:
 *         description: User, store, or role not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: User not found or is inactive
 *       409:
 *         description: Conflict - User already assigned to this store
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: User is already assigned as manager for this store
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Server error
 */
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

/**
 * @swagger
 * /api/admin/assignments/{userId}/{storeId}:
 *   delete:
 *     summary: Remove a store assignment from a manager
 *     description: Removes the assignment of a store from a specific manager
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The user ID of the manager
 *       - in: path
 *         name: storeId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The store ID to remove from the manager
 *     responses:
 *       200:
 *         description: Store assignment removed successfully
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
 *                   example: Store assignment removed successfully
 *                 data:
 *                   $ref: '#/components/schemas/StoreAssignment'
 *       404:
 *         description: Store assignment not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Store assignment not found
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Server error
 */
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

/**
 * @swagger
 * /api/admin/managers:
 *   get:
 *     summary: Get all store managers
 *     description: Get a list of all users with STORE_MANAGER role, with optional filtering for unassigned managers
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: unassigned
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filter to show only managers without store assignments
 *     responses:
 *       200:
 *         description: List of store managers
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
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Manager'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Server error
 */
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

/**
 * @swagger
 * /api/admin/managers/{userId}/stores:
 *   get:
 *     summary: Get stores managed by a specific manager
 *     description: Returns all stores assigned to a specific user with STORE_MANAGER role
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The user ID of the manager
 *     responses:
 *       200:
 *         description: List of stores managed by the user
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
 *                   example: 3
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Store'
 *                 user:
 *                   type: object
 *                   properties:
 *                     user_id:
 *                       type: integer
 *                     username:
 *                       type: string
 *                     full_name:
 *                       type: string
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: User not found
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Server error
 */
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

/**
 * @swagger
 * /api/admin/stores/unassigned:
 *   get:
 *     summary: Get all unassigned stores
 *     description: Returns all active stores that are not assigned to any store manager
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of unassigned stores
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
 *                   example: 2
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Store'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Server error
 */
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

/**
 * @swagger
 * /api/admin/stores/assigned:
 *   get:
 *     summary: Get all assigned stores
 *     description: Returns all active stores that are assigned to at least one store manager
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of assigned stores
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
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Store'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Server error
 */
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

