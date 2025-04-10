import pool from '../config/pool.js';

/**
 * @swagger
 * components:
 *   schemas:
 *     Store:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         store_id:
 *           type: integer
 *           description: The auto-generated store ID
 *         name:
 *           type: string
 *           description: Store name
 *         address:
 *           type: string
 *           description: Store physical address
 *         phone:
 *           type: string
 *           description: Store contact phone number
 *         email:
 *           type: string
 *           format: email
 *           description: Store contact email
 *         is_active:
 *           type: boolean
 *           default: true
 *           description: Whether the store is active
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Store creation timestamp
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Store last update timestamp
 *       example:
 *         store_id: 1
 *         name: Downtown Electronics
 *         address: 123 Main St, Cityville, ST 12345
 *         phone: (555) 123-4567
 *         email: downtown@example.com
 *         is_active: true
 *         created_at: 2023-01-01T00:00:00.000Z
 *         updated_at: 2023-01-01T00:00:00.000Z
 *     
 *     StoreWithStats:
 *       allOf:
 *         - $ref: '#/components/schemas/Store'
 *         - type: object
 *           properties:
 *             managersCount:
 *               type: integer
 *               description: Number of managers assigned to the store
 *             productCount:
 *               type: integer
 *               description: Number of distinct products in the store
 *       example:
 *         store_id: 1
 *         name: Downtown Electronics
 *         address: 123 Main St, Cityville, ST 12345
 *         phone: (555) 123-4567
 *         email: downtown@example.com
 *         is_active: true
 *         created_at: 2023-01-01T00:00:00.000Z
 *         updated_at: 2023-01-01T00:00:00.000Z
 *         managersCount: 2
 *         productCount: 45
 *     
 *     StoreInput:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           description: Store name
 *         address:
 *           type: string
 *           description: Store physical address
 *         phone:
 *           type: string
 *           description: Store contact phone number
 *         email:
 *           type: string
 *           format: email
 *           description: Store contact email
 *         is_active:
 *           type: boolean
 *           default: true
 *           description: Whether the store is active
 *       example:
 *         name: Downtown Electronics
 *         address: 123 Main St, Cityville, ST 12345
 *         phone: (555) 123-4567
 *         email: downtown@example.com
 *         is_active: true
 *     
 *     StoreStatusUpdate:
 *       type: object
 *       required:
 *         - is_active
 *       properties:
 *         is_active:
 *           type: boolean
 *           description: New active status for the store
 *       example:
 *         is_active: false
 *     
 *     StoreManager:
 *       type: object
 *       properties:
 *         user_id:
 *           type: integer
 *           description: User ID of the manager
 *         username:
 *           type: string
 *           description: Username of the manager
 *         email:
 *           type: string
 *           format: email
 *           description: Email of the manager
 *         full_name:
 *           type: string
 *           description: Full name of the manager
 *         is_active:
 *           type: boolean
 *           description: Whether the manager is active
 *         role:
 *           type: string
 *           description: Role of the user (STORE_MANAGER)
 *       example:
 *         user_id: 2
 *         username: manager1
 *         email: manager1@example.com
 *         full_name: John Manager
 *         is_active: true
 *         role: STORE_MANAGER
 *     
 *     StoreFullDetails:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Operation success status
 *         storeInfo:
 *           $ref: '#/components/schemas/Store'
 *         dateRange:
 *           type: object
 *           properties:
 *             startDate:
 *               type: string
 *               format: date
 *               description: Start date for the report data
 *             endDate:
 *               type: string
 *               format: date
 *               description: End date for the report data
 *         managers:
 *           type: object
 *           properties:
 *             count:
 *               type: integer
 *               description: Number of managers assigned to the store
 *             data:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/StoreManager'
 *         inventorySummary:
 *           type: object
 *           properties:
 *             totalValue:
 *               type: string
 *               description: Total value of inventory in the store
 *             itemCount:
 *               type: integer
 *               description: Number of distinct product items in inventory
 *             items:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   product_id:
 *                     type: integer
 *                   product_name:
 *                     type: string
 *                   sku:
 *                     type: string
 *                   quantity:
 *                     type: integer
 *                   unit_price:
 *                     type: number
 *                     format: float
 *                   total_value:
 *                     type: number
 *                     format: float
 *         stockMovements:
 *           type: object
 *           properties:
 *             count:
 *               type: integer
 *               description: Number of stock movements in the time period
 *             data:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   movement_id:
 *                     type: integer
 *                   movement_date:
 *                     type: string
 *                     format: date-time
 *                   movement_type:
 *                     type: string
 *                     enum: [STOCK_IN, SALE, MANUAL_REMOVAL]
 *                   quantity:
 *                     type: integer
 *                   product_name:
 *                     type: string
 *                   sku:
 *                     type: string
 *                   created_by:
 *                     type: string
 *         topSellingProducts:
 *           type: object
 *           properties:
 *             count:
 *               type: integer
 *               description: Number of top-selling products
 *             data:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   product_id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   sku:
 *                     type: string
 *                   total_sold:
 *                     type: integer
 *         lowStockItems:
 *           type: object
 *           properties:
 *             count:
 *               type: integer
 *               description: Number of low stock items
 *             data:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   product_id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   sku:
 *                     type: string
 *                   quantity:
 *                     type: integer
 *     
 *     AllStoresDetails:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Operation success status
 *         dateRange:
 *           type: object
 *           properties:
 *             startDate:
 *               type: string
 *               format: date
 *             endDate:
 *               type: string
 *               format: date
 *         storesCount:
 *           type: integer
 *           description: Number of active stores
 *         stores:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               inventoryValue:
 *                 type: string
 *                 description: Total inventory value in the store
 *               productCount:
 *                 type: integer
 *                 description: Number of products in the store
 *               salesData:
 *                 type: object
 *                 properties:
 *                   transactionCount:
 *                     type: integer
 *                   totalSales:
 *                     type: string
 *                     description: Total sales value in the period
 *               managerCount:
 *                 type: integer
 *                 description: Number of managers assigned to the store
 *               lowStockCount:
 *                 type: integer
 *                 description: Number of low stock items
 */

/**
 * @swagger
 * tags:
 *   name: Stores
 *   description: Store management and reporting
 */

/**
 * @swagger
 * /api/stores:
 *   get:
 *     summary: Get all stores
 *     description: Retrieve a list of all stores with optional filtering
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter stores by name (case-insensitive partial match)
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filter stores by active status
 *     responses:
 *       200:
 *         description: List of stores
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
 *                   example: 10
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Store'
 *       401:
 *         description: Unauthorized - User not authenticated
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /api/stores/{id}:
 *   get:
 *     summary: Get store by ID
 *     description: Retrieve a specific store by its ID with additional statistics
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Store ID to retrieve
 *     responses:
 *       200:
 *         description: Store details with statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/StoreWithStats'
 *       401:
 *         description: Unauthorized - User not authenticated
 *       404:
 *         description: Store not found
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /api/stores:
 *   post:
 *     summary: Create a new store
 *     description: Create a new store (admin only)
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StoreInput'
 *     responses:
 *       201:
 *         description: Store created successfully
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
 *                   example: Store created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Store'
 *       400:
 *         description: Bad request - Invalid input or missing required fields
 *       401:
 *         description: Unauthorized - User not authenticated
 *       403:
 *         description: Forbidden - User is not an admin
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /api/stores/{id}:
 *   put:
 *     summary: Update a store
 *     description: Update an existing store (admin only)
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Store ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StoreInput'
 *     responses:
 *       200:
 *         description: Store updated successfully
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
 *                   example: Store updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Store'
 *       400:
 *         description: Bad request - Invalid input or missing required fields
 *       401:
 *         description: Unauthorized - User not authenticated
 *       403:
 *         description: Forbidden - User is not an admin
 *       404:
 *         description: Store not found
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /api/stores/{id}:
 *   delete:
 *     summary: Delete a store
 *     description: Delete a store that has no inventory or assigned users (admin only)
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Store ID to delete
 *     responses:
 *       200:
 *         description: Store deleted successfully
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
 *                   example: Store deleted successfully
 *                 data:
 *                   $ref: '#/components/schemas/Store'
 *       400:
 *         description: Bad request - Cannot delete store with dependencies
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
 *                   example: Cannot delete store with existing inventory movements. Deactivate it instead.
 *       401:
 *         description: Unauthorized - User not authenticated
 *       403:
 *         description: Forbidden - User is not an admin
 *       404:
 *         description: Store not found
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /api/stores/{id}/status:
 *   patch:
 *     summary: Change store status
 *     description: Activate or deactivate a store (admin only)
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Store ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StoreStatusUpdate'
 *     responses:
 *       200:
 *         description: Store status updated successfully
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
 *                   example: Store activated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Store'
 *       400:
 *         description: Bad request - Missing required fields
 *       401:
 *         description: Unauthorized - User not authenticated
 *       403:
 *         description: Forbidden - User is not an admin
 *       404:
 *         description: Store not found
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /api/stores/{id}/managers:
 *   get:
 *     summary: Get store managers
 *     description: Retrieve all managers assigned to a specific store (admin only)
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Store ID to get managers for
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
 *                   example: 3
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/StoreManager'
 *       401:
 *         description: Unauthorized - User not authenticated
 *       403:
 *         description: Forbidden - User is not an admin
 *       404:
 *         description: Store not found
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /api/stores/{id}/full-details:
 *   get:
 *     summary: Get detailed store report
 *     description: Get comprehensive report for a store including inventory, sales, managers and more
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Store ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for report data (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for report data (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Detailed store report
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StoreFullDetails'
 *       401:
 *         description: Unauthorized - User not authenticated
 *       403:
 *         description: Forbidden - User is not an admin
 *       404:
 *         description: Store not found
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /api/stores/reports/all:
 *   get:
 *     summary: Get all stores report
 *     description: Get comprehensive report across all active stores
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for report data (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for report data (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: All stores report
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AllStoresDetails'
 *       401:
 *         description: Unauthorized - User not authenticated
 *       403:
 *         description: Forbidden - User is not an admin
 *       500:
 *         description: Server error
 */
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
    
    const activeStores = storesQuery.rows;
    
    // Create an array to hold all store IDs for batch querying
    const storeIds = activeStores.map(store => store.store_id);
    
    // Execute all common queries in parallel to get data for all stores at once
    const [inventoryValues, productCounts, salesData, managerCounts, lowStockCounts] = await Promise.all([
      // Get inventory values for all stores - FIXED to avoid nested aggregates
      pool.query(`
        WITH current_stock AS (
          SELECT 
            sm.store_id,
            sm.product_id,
            p.unit_price,
            SUM(CASE 
              WHEN sm.movement_type = 'STOCK_IN' THEN sm.quantity
              WHEN sm.movement_type IN ('SALE', 'MANUAL_REMOVAL') THEN -sm.quantity
              ELSE 0
            END) AS quantity
          FROM stock_movements sm
          JOIN products p ON p.product_id = sm.product_id
          WHERE sm.store_id = ANY($1)
          GROUP BY sm.store_id, sm.product_id, p.unit_price
          HAVING SUM(CASE 
            WHEN sm.movement_type = 'STOCK_IN' THEN sm.quantity
            WHEN sm.movement_type IN ('SALE', 'MANUAL_REMOVAL') THEN -sm.quantity
            ELSE 0
          END) > 0
        )
        SELECT 
          store_id,
          SUM(unit_price * quantity) AS total_value
        FROM current_stock
        GROUP BY store_id
      `, [storeIds]),
      
      // Get product counts for all stores
      pool.query(`
        SELECT 
          store_id,
          COUNT(DISTINCT product_id) AS product_count
        FROM (
          SELECT 
            sm.store_id,
            sm.product_id,
            SUM(CASE 
              WHEN sm.movement_type = 'STOCK_IN' THEN sm.quantity
              WHEN sm.movement_type IN ('SALE', 'MANUAL_REMOVAL') THEN -sm.quantity
              ELSE 0
            END) AS current_stock
          FROM stock_movements sm
          WHERE sm.store_id = ANY($1)
          GROUP BY sm.store_id, sm.product_id
          HAVING SUM(CASE 
            WHEN sm.movement_type = 'STOCK_IN' THEN sm.quantity
            WHEN sm.movement_type IN ('SALE', 'MANUAL_REMOVAL') THEN -sm.quantity
            ELSE 0
          END) > 0
        ) AS products_with_stock
        GROUP BY store_id
      `, [storeIds]),
      
      // Get sales data for all stores in date range
      pool.query(`
        SELECT 
          store_id,
          COUNT(DISTINCT movement_id) AS transaction_count,
          SUM(quantity * unit_price) AS total_sales
        FROM stock_movements
        WHERE store_id = ANY($1)
          AND movement_type = 'SALE'
          AND created_at BETWEEN $2 AND $3
        GROUP BY store_id
      `, [storeIds, formattedStartDate, formattedEndDate]),
      
      // Get manager counts for all stores
      pool.query(`
        SELECT 
          store_id,
          COUNT(*) AS manager_count
        FROM user_roles
        WHERE store_id = ANY($1) 
          AND role = 'STORE_MANAGER'
        GROUP BY store_id
      `, [storeIds]),
      
      // Get low stock counts for all stores
      pool.query(`
        SELECT 
          store_id,
          COUNT(DISTINCT product_id) AS low_stock_count
        FROM (
          SELECT 
            sm.store_id,
            sm.product_id,
            SUM(CASE 
              WHEN sm.movement_type = 'STOCK_IN' THEN sm.quantity
              WHEN sm.movement_type IN ('SALE', 'MANUAL_REMOVAL') THEN -sm.quantity
              ELSE 0
            END) AS current_stock
          FROM stock_movements sm
          WHERE sm.store_id = ANY($1)
          GROUP BY sm.store_id, sm.product_id
          HAVING SUM(CASE 
            WHEN sm.movement_type = 'STOCK_IN' THEN sm.quantity
            WHEN sm.movement_type IN ('SALE', 'MANUAL_REMOVAL') THEN -sm.quantity
            ELSE 0
          END) > 0 
          AND SUM(CASE 
            WHEN sm.movement_type = 'STOCK_IN' THEN sm.quantity
            WHEN sm.movement_type IN ('SALE', 'MANUAL_REMOVAL') THEN -sm.quantity
            ELSE 0
          END) <= 10
        ) AS low_stock_products
        GROUP BY store_id
      `, [storeIds])
    ]);
    
    // Process inventory values to get totals per store
    const inventoryValuesByStore = {};
    inventoryValues.rows.forEach(row => {
      inventoryValuesByStore[row.store_id] = parseFloat(row.total_value || 0);
    });
    
    // Create lookup objects for each data type
    const productCountsByStore = {};
    productCounts.rows.forEach(row => {
      productCountsByStore[row.store_id] = parseInt(row.product_count);
    });
    
    const salesDataByStore = {};
    salesData.rows.forEach(row => {
      salesDataByStore[row.store_id] = {
        transactionCount: parseInt(row.transaction_count),
        totalSales: parseFloat(row.total_sales || 0)
      };
    });
    
    const managerCountsByStore = {};
    managerCounts.rows.forEach(row => {
      managerCountsByStore[row.store_id] = parseInt(row.manager_count);
    });
    
    const lowStockCountsByStore = {};
    lowStockCounts.rows.forEach(row => {
      lowStockCountsByStore[row.store_id] = parseInt(row.low_stock_count);
    });

    // Map store data with the collected metrics
    const storesData = activeStores.map(store => {
      const storeId = store.store_id;
      return {
        id: storeId,
        name: store.name,
        address: store.address,
        phone: store.phone,
        email: store.email,
        isActive: store.is_active,
        inventoryValue: Number(inventoryValuesByStore[storeId] || 0).toFixed(2),
        productCount: productCountsByStore[storeId] || 0,
        salesData: {
          transactionCount: salesDataByStore[storeId]?.transactionCount || 0,
          totalSales: Number(salesDataByStore[storeId]?.totalSales || 0).toFixed(2)
        },
        managerCount: managerCountsByStore[storeId] || 0,
        lowStockCount: lowStockCountsByStore[storeId] || 0
      };
    });

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
/**
 * Helper function to validate email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};