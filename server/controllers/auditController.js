import pool from '../config/pool.js';

/**
 * @swagger
 * components:
 *   schemas:
 *     AuditLog:
 *       type: object
 *       properties:
 *         audit_id:
 *           type: integer
 *           description: The unique ID of the audit record
 *         table_name:
 *           type: string
 *           description: The name of the table that was modified
 *         record_id:
 *           type: integer
 *           description: The ID of the record that was modified
 *         operation:
 *           type: string
 *           enum: [INSERT, UPDATE, DELETE]
 *           description: The type of operation performed
 *         old_data:
 *           type: object
 *           description: The data before the change (for updates and deletes)
 *         new_data:
 *           type: object
 *           description: The data after the change (for inserts and updates)
 *         user_id:
 *           type: integer
 *           description: The ID of the user who made the change
 *         user_name:
 *           type: string
 *           description: The username of the user who made the change
 *         ip_address:
 *           type: string
 *           description: IP address of the requester
 *         user_agent:
 *           type: string
 *           description: User agent of the requester
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: When the audit event was recorded
 *       example:
 *         audit_id: 1
 *         table_name: products
 *         record_id: 123
 *         operation: UPDATE
 *         old_data: {"product_id":123,"name":"Old Product Name","price":9.99}
 *         new_data: {"product_id":123,"name":"New Product Name","price":19.99}
 *         user_id: 5
 *         user_name: "admin"
 *         ip_address: "192.168.1.100"
 *         created_at: "2023-04-15T14:22:18.123Z"
 */

/**
 * @swagger
 * tags:
 *   name: Audit
 *   description: Audit log management
 */

/**
 * @swagger
 * /api/audit/logs:
 *   get:
 *     summary: Get audit logs
 *     description: Retrieve audit logs with optional filtering
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: table_name
 *         schema:
 *           type: string
 *         description: Filter by table name
 *       - in: query
 *         name: record_id
 *         schema:
 *           type: integer
 *         description: Filter by record ID
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: integer
 *         description: Filter by user ID
 *       - in: query
 *         name: operation
 *         schema:
 *           type: string
 *           enum: [INSERT, UPDATE, DELETE]
 *         description: Filter by operation type
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for audit logs (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for audit logs (YYYY-MM-DD)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Maximum number of records to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of records to skip
 *     responses:
 *       200:
 *         description: List of audit logs
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
 *                   description: Total number of matching records
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AuditLog'
 *       401:
 *         description: Unauthorized - User not authenticated
 *       403:
 *         description: Forbidden - User is not an admin
 *       500:
 *         description: Server error
 */
export const getAuditLogs = async (req, res) => {
  try {
    const {
      table_name,
      record_id,
      user_id,
      operation,
      startDate,
      endDate,
      limit = 100,
      offset = 0
    } = req.query;

    // Build the query conditions
    const conditions = [];
    const queryParams = [];
    let paramIndex = 1;

    if (table_name) {
      conditions.push(`a.table_name = $${paramIndex++}`);
      queryParams.push(table_name);
    }

    if (record_id) {
      conditions.push(`a.record_id = $${paramIndex++}`);
      queryParams.push(parseInt(record_id));
    }

    if (user_id) {
      conditions.push(`a.user_id = $${paramIndex++}`);
      queryParams.push(parseInt(user_id));
    }

    if (operation) {
      conditions.push(`a.operation = $${paramIndex++}`);
      queryParams.push(operation.toUpperCase());
    }

    if (startDate) {
      conditions.push(`a.created_at >= $${paramIndex++}`);
      queryParams.push(new Date(startDate));
    }

    if (endDate) {
      conditions.push(`a.created_at <= $${paramIndex++}`);
      // Add one day to include the end date fully
      const endDateObj = new Date(endDate);
      endDateObj.setDate(endDateObj.getDate() + 1);
      queryParams.push(endDateObj);
    }

    // Create the WHERE clause if we have conditions
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total matching records
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM audit_logs a
      ${whereClause}
    `;
    
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Add pagination parameters
    queryParams.push(parseInt(limit));
    queryParams.push(parseInt(offset));

    // Get the paginated audit logs
    const query = `
      SELECT 
        a.audit_id, 
        a.table_name, 
        a.record_id, 
        a.operation, 
        a.old_data, 
        a.new_data, 
        a.user_id, 
        u.username AS user_name,
        a.ip_address,
        a.user_agent,
        a.created_at
      FROM 
        audit_logs a
      LEFT JOIN 
        users u ON a.user_id = u.user_id
      ${whereClause}
      ORDER BY 
        a.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    const result = await pool.query(query, queryParams);

    res.status(200).json({
      success: true,
      count: total,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @swagger
 * /api/audit/logs/{id}:
 *   get:
 *     summary: Get audit log by ID
 *     description: Retrieve a specific audit log entry by its ID
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Audit log ID
 *     responses:
 *       200:
 *         description: Audit log details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/AuditLog'
 *       401:
 *         description: Unauthorized - User not authenticated
 *       403:
 *         description: Forbidden - User is not an admin
 *       404:
 *         description: Audit log not found
 *       500:
 *         description: Server error
 */
export const getAuditLogById = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        a.audit_id, 
        a.table_name, 
        a.record_id, 
        a.operation, 
        a.old_data, 
        a.new_data, 
        a.user_id, 
        u.username AS user_name,
        a.ip_address,
        a.user_agent,
        a.created_at
      FROM 
        audit_logs a
      LEFT JOIN 
        users u ON a.user_id = u.user_id
      WHERE 
        a.audit_id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Audit log not found'
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching audit log by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @swagger
 * /api/audit/entity/{table}/{id}:
 *   get:
 *     summary: Get audit history for a specific entity
 *     description: Retrieve audit history for a specific record in a table
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: table
 *         schema:
 *           type: string
 *         required: true
 *         description: Table name
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Record ID
 *     responses:
 *       200:
 *         description: Audit history for the entity
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AuditLog'
 *       401:
 *         description: Unauthorized - User not authenticated
 *       403:
 *         description: Forbidden - User is not an admin
 *       500:
 *         description: Server error
 */
export const getEntityAuditHistory = async (req, res) => {
  try {
    const { table, id } = req.params;

    // Validate table name to prevent SQL injection
    const validTables = ['products', 'stores', 'stock_movements', 'users'];
    if (!validTables.includes(table)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid table name'
      });
    }

    const query = `
      SELECT 
        a.audit_id, 
        a.table_name, 
        a.record_id, 
        a.operation, 
        a.old_data, 
        a.new_data, 
        a.user_id, 
        u.username AS user_name,
        a.ip_address,
        a.created_at
      FROM 
        audit_logs a
      LEFT JOIN 
        users u ON a.user_id = u.user_id
      WHERE 
        a.table_name = $1 AND a.record_id = $2
      ORDER BY 
        a.created_at DESC
    `;

    const result = await pool.query(query, [table, id]);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching entity audit history:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @swagger
 * /api/audit/statistics:
 *   get:
 *     summary: Get audit statistics
 *     description: Retrieve summary statistics about audit logs
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Audit statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalAuditCount:
 *                       type: integer
 *                     operationCounts:
 *                       type: object
 *                     tableAuditCounts:
 *                       type: object
 *                     recentActivity:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                           count:
 *                             type: integer
 *       401:
 *         description: Unauthorized - User not authenticated
 *       403:
 *         description: Forbidden - User is not an admin
 *       500:
 *         description: Server error
 */
export const getAuditStatistics = async (req, res) => {
  try {
    // Get overall count
    const totalCountQuery = `SELECT COUNT(*) as total FROM audit_logs`;
    const totalCountResult = await pool.query(totalCountQuery);
    
    // Get counts by operation
    const operationCountQuery = `
      SELECT operation, COUNT(*) as count 
      FROM audit_logs 
      GROUP BY operation
    `;
    const operationCountResult = await pool.query(operationCountQuery);
    
    // Convert to object format
    const operationCounts = {};
    operationCountResult.rows.forEach(row => {
      operationCounts[row.operation] = parseInt(row.count);
    });
    
    // Get counts by table
    const tableCountQuery = `
      SELECT table_name, COUNT(*) as count 
      FROM audit_logs 
      GROUP BY table_name
      ORDER BY count DESC
    `;
    const tableCountResult = await pool.query(tableCountQuery);
    
    // Convert to object format
    const tableAuditCounts = {};
    tableCountResult.rows.forEach(row => {
      tableAuditCounts[row.table_name] = parseInt(row.count);
    });
    
    // Get recent activity (last 30 days)
    const recentActivityQuery = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM 
        audit_logs
      WHERE 
        created_at >= NOW() - INTERVAL '30 days'
      GROUP BY 
        DATE(created_at)
      ORDER BY 
        date DESC
    `;
    const recentActivityResult = await pool.query(recentActivityQuery);
    
    res.status(200).json({
      success: true,
      data: {
        totalAuditCount: parseInt(totalCountResult.rows[0].total),
        operationCounts,
        tableAuditCounts,
        recentActivity: recentActivityResult.rows
      }
    });
  } catch (error) {
    console.error('Error fetching audit statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};