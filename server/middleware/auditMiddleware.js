import pool from '../config/pool.js';

/**
 * Middleware that sets the current user ID in the PostgreSQL session
 * This allows the audit triggers to capture which user made a change
 */
const setAuditUser = async (req, res, next) => {
  try {
    if (req.user && req.user.id) {
      // Set the user ID in the current PostgreSQL session
      await pool.query(`SET LOCAL app.current_user_id = '${req.user.id}'`);
      
      // Also capture IP and user agent if needed
      if (req.ip || req.headers['user-agent']) {
        res.locals.auditInfo = {
          ip_address: req.ip,
          user_agent: req.headers['user-agent']
        };
      }
    }
    next();
  } catch (error) {
    console.error('Error setting audit user:', error);
    next();
  }
};

export default setAuditUser;