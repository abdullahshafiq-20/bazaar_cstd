import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/pool.js';

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - username
 *         - email
 *         - password
 *       properties:
 *         user_id:
 *           type: integer
 *           description: The auto-generated user ID
 *         username:
 *           type: string
 *           description: Unique username for the user
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         full_name:
 *           type: string
 *           description: User's full name
 *         is_active:
 *           type: boolean
 *           default: true
 *           description: Whether the user account is active
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: The timestamp when the user was created
 *       example:
 *         user_id: 1
 *         username: johnsmith
 *         email: john.smith@example.com
 *         full_name: John Smith
 *         is_active: true
 *         created_at: 2023-01-01T00:00:00.000Z
 *     
 *     UserRole:
 *       type: object
 *       required:
 *         - user_id
 *         - role
 *       properties:
 *         user_id:
 *           type: integer
 *           description: The ID of the user
 *         role:
 *           type: string
 *           enum: [ADMIN, STORE_MANAGER]
 *           description: The role assigned to the user
 *         store_id:
 *           type: integer
 *           nullable: true
 *           description: The store ID this role applies to (null for ADMIN)
 *       example:
 *         user_id: 1
 *         role: STORE_MANAGER
 *         store_id: 2
 *     
 *     LoginRequest:
 *       type: object
 *       required:
 *         - username
 *         - password
 *       properties:
 *         username:
 *           type: string
 *           description: Username for login
 *         password:
 *           type: string
 *           format: password
 *           description: Password for login
 *       example:
 *         username: johnsmith
 *         password: SecurePassword123!
 *     
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - username
 *         - email
 *         - password
 *       properties:
 *         username:
 *           type: string
 *           description: Desired username
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         password:
 *           type: string
 *           format: password
 *           description: Strong password
 *         full_name:
 *           type: string
 *           description: User's full name
 *       example:
 *         username: johnsmith
 *         email: john.smith@example.com
 *         password: SecurePassword123!
 *         full_name: John Smith
 *     
 *     LoginResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Login successful
 *         token:
 *           type: string
 *           description: JWT authentication token
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             username:
 *               type: string
 *             email:
 *               type: string
 *             fullName:
 *               type: string
 *             roles:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   role:
 *                     type: string
 *                   storeId:
 *                     type: integer
 *                     nullable: true
 *             isAdmin:
 *               type: boolean
 *       example:
 *         success: true
 *         message: Login successful
 *         token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *         user:
 *           id: 1
 *           username: johnsmith
 *           email: john.smith@example.com
 *           fullName: John Smith
 *           roles:
 *             - role: STORE_MANAGER
 *               storeId: 2
 *           isAdmin: false
 *   
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication and account management
 */

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '24h';

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new store manager
 *     description: Create a new user account with STORE_MANAGER role
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: User registered successfully
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
 *                   example: User registered successfully
 *                 user:
 *                   type: object
 *                   properties:
 *                     user_id:
 *                       type: integer
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *                     full_name:
 *                       type: string
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad request - missing required fields
 *       409:
 *         description: Username or email already exists
 *       500:
 *         description: Internal server error
 */
export const registerUser = async (req, res) => {
  try {
    const { username, email, password, full_name } = req.body;
    
    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Username, email, and password are required' });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'Username or email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert new user
    const result = await pool.query(
      'INSERT INTO users (username, password_hash, email, full_name) VALUES ($1, $2, $3, $4) RETURNING user_id, username, email, full_name, created_at',
      [username, passwordHash, email, full_name]
    );

    await pool.query(
      'INSERT INTO user_roles (user_id, role) VALUES ($1, $2)',
      [result.rows[0].user_id, 'STORE_MANAGER']
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('User registration error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @swagger
 * /api/admin/register:
 *   post:
 *     summary: Register a new system administrator
 *     description: Create a new user account with ADMIN role (requires admin privileges)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: System administrator registered successfully
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
 *                   example: System administrator registered successfully
 *                 user:
 *                   type: object
 *                   properties:
 *                     user_id:
 *                       type: integer
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *                     full_name:
 *                       type: string
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad request - missing required fields
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       403:
 *         description: Forbidden - user is not an admin
 *       409:
 *         description: Username or email already exists
 *       500:
 *         description: Internal server error
 */
export const registerAdmin = async (req, res) => {
    try {
      const { username, email, password, full_name } = req.body;
      
      // Validate required fields
      if (!username || !email || !password) {
        return res.status(400).json({ success: false, message: 'Username, email, and password are required' });
      }
  
      // Check if user already exists
      const existingUser = await pool.query(
        'SELECT * FROM users WHERE username = $1 OR email = $2',
        [username, email]
      );
  
      if (existingUser.rows.length > 0) {
        return res.status(409).json({ success: false, message: 'Username or email already exists' });
      }
  
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
  
      // Database transaction for creating user and role
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');
        
        // Insert new user
        const userResult = await client.query(
          'INSERT INTO users (username, password_hash, email, full_name) VALUES ($1, $2, $3, $4) RETURNING user_id, username, email, full_name, created_at',
          [username, passwordHash, email, full_name]
        );
        
        const userId = userResult.rows[0].user_id;
        
        // Set role as ADMIN (with null store_id to indicate global admin)
        await client.query(
          'INSERT INTO user_roles (user_id, role, store_id) VALUES ($1, $2, $3)',
          [userId, 'ADMIN', null] // null store_id indicates a global admin
        );
        
        await client.query('COMMIT');
        
        res.status(201).json({
          success: true,
          message: 'System administrator registered successfully',
          user: userResult.rows[0]
        });
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Admin registration error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * @swagger
 * /api/admin/initial-setup:
 *   post:
 *     summary: Initial admin setup for a new installation
 *     description: Creates the first admin user in a new system (only works when no admins exist)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: System administrator registered successfully
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
 *                   example: System administrator registered successfully
 *                 user:
 *                   type: object
 *                   properties:
 *                     user_id:
 *                       type: integer
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *                     full_name:
 *                       type: string
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad request - missing required fields
 *       409:
 *         description: Username or email already exists, or admin user already exists
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Authenticate a user
 *     description: Log in with username and password to get authentication token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Bad request - Username and password are required
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Account is inactive
 *       500:
 *         description: Internal server error
 */
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validate required fields
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }
    

    // Find user
    const result = await pool.query(
      'SELECT user_id, username, password_hash, email, full_name, is_active FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Check if user is active
    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Account is inactive' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Get user roles with store_id
    const rolesResult = await pool.query(
      'SELECT role, store_id FROM user_roles WHERE user_id = $1',
      [user.user_id]
    );

    const roles = rolesResult.rows.map(row => ({
      role: row.role,
      storeId: row.store_id // Make sure store_id is included here
    }));

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.user_id,
        username: user.username,
        email: user.email,
        roles, // This includes the role and storeId
        isAdmin: roles.some(r => r.role === 'ADMIN')
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.user_id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        roles,
        isAdmin: roles.some(r => r.role === 'ADMIN')
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get user profile
 *     description: Returns the profile information of the currently authenticated user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   type: object
 *                   properties:
 *                     user_id:
 *                       type: integer
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *                     full_name:
 *                       type: string
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     roles:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           role:
 *                             type: string
 *                           store_id:
 *                             type: integer
 *                             nullable: true
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
export const getProfile = async (req, res) => {
  try {
    // User ID is extracted from JWT token by auth middleware
    const userId = req.user.id;
    const token = req.headers.authorization.split(' ')[1];
    
    const result = await pool.query(
      'SELECT user_id, username, email, full_name, created_at FROM users WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const rolesResult = await pool.query(
      'SELECT role, store_id FROM user_roles WHERE user_id = $1',
      [userId]
    );

    res.status(200).json({
      success: true,
      user: {
        ...result.rows[0],
        roles: rolesResult.rows
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};