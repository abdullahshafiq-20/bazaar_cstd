import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Middleware to verify JWT token and extract user info
 */
export const verifyToken = (req, res, next) => {
    try {
      console.log('Path being checked:', req.originalUrl);
      if (req.path === '/auth/login' && req.method === 'POST') {
        console.log('Bypassing token check for login route');
        return next();
      }
      
      const authHeader = req.headers.authorization;
      console.log('Auth header:', authHeader ? 'Present' : 'Missing');
      
      if (!authHeader) {
        return res.status(401).json({ success: false, message: 'No token provided' });
      }
      
      const token = authHeader.split(' ')[1];
      console.log('Token extracted:', token ? 'Yes' : 'No');
      
      if (!token) {
        return res.status(401).json({ success: false, message: 'No token provided' });
      }
      
      jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
          console.log('Token verification error:', err.message);
          return res.status(401).json({ success: false, message: 'Invalid or expired token' });
        }
        
        console.log('Token verified successfully. User:', decoded.username);
        req.user = decoded;
        next();
      });
    } catch (error) {
      console.error('Token verification error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };

/**
 * Middleware to check if user is an admin
 * Global admins have the ADMIN role with null store_id
 */
export const requireAdmin = (req, res, next) => {
  try {
    if (req.path === '/auth/login' && req.method === 'POST') {
        console.log('Bypassing token check for login route');
        return next();
    }
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    
    const isAdmin = req.user.roles.some(r => r.role === 'ADMIN' && r.storeId === null);
    
    if (!isAdmin) {
      return res.status(403).json({ 
        success: false, 
        message: 'System administrator access required' 
      });
    }
    
    next();
  } catch (error) {
    console.error('Admin verification error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Middleware to check if user is a store manager for a specific store
 */
export const requireStoreManager = (req, res, next) => {
    try {
      // Authentication bypass for login shouldn't be here - it belongs in verifyToken only
      // Remove this block as it's not relevant for store manager checks
      if (req.path === '/auth/login' && req.method === 'POST' ) {
          console.log('Bypassing token check for login route');
          return next();
      }
      
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }
      
      // Get store ID from route parameters, query parameters, or request body
      let storeId = null;
      
      // Check route parameters first (for routes like /stores/:id/...)
      if (req.params.id) {
        storeId = parseInt(req.params.id);
      } 
      // Check for storeId in query params
      else if (req.query.storeId) {
        storeId = parseInt(req.query.storeId);
      }
      // Finally check body
      else if (req.body && req.body.storeId) {
        storeId = parseInt(req.body.storeId);
      }
      
      // If still no storeId found
      if (!storeId) {
        console.log('Store ID not found in request:', {
          params: req.params,
          query: req.query,
          body: req.body ? 'Present' : 'Missing'
        });
        return res.status(400).json({ 
          success: false, 
          message: 'Store ID is required but not found in request'
        });
      }
      
      console.log('Checking permissions for store ID:', storeId);
      console.log('User roles:', req.user.roles);
      
      // Global admins can manage any store
      const isAdmin = req.user.roles.some(r => r.role === 'ADMIN' && r.storeId === null);
      const isStoreManager = req.user.roles.some(
        r => (r.role === 'STORE_MANAGER' && parseInt(r.storeId) === storeId)
      );
      
      console.log('Is admin:', isAdmin);
      console.log('Is store manager for this store:', isStoreManager);
      
      if (!isAdmin && !isStoreManager) {
        return res.status(403).json({ 
          success: false, 
          message: 'You must be an administrator or the manager of this store to perform this action' 
        });
      }
      
      next();
    } catch (error) {
      console.error('Store manager verification error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };