import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Middleware to verify JWT token and extract user info
 */
export const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1]; // Format: "Bearer TOKEN"
    
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({ 
          success: false, 
          message: err.name === 'TokenExpiredError' 
            ? 'Token has expired' 
            : 'Invalid token'
        });
      }
      
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
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    
    const storeId = parseInt(req.params.storeId || req.body.storeId);
    
    if (!storeId) {
      return res.status(400).json({ success: false, message: 'Store ID is required' });
    }
    
    // Global admins can manage any store
    const isAdmin = req.user.roles.some(r => r.role === 'ADMIN' && r.storeId === null);
    const isStoreManager = req.user.roles.some(
      r => (r.role === 'STORE_MANAGER' && r.storeId === storeId)
    );
    
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