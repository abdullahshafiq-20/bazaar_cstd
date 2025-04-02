import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/pool.js';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '24h';


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