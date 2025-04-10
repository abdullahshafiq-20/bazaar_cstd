import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

// Default configuration (can be overridden by environment variables)
const DEFAULT_WINDOW_MS = 60000; // 1 minute in milliseconds
const DEFAULT_MAX_REQUESTS = 100; // Max requests per window
const DEFAULT_MESSAGE = 'Too many requests, please try again later.';

// Get configuration from environment variables
const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || DEFAULT_WINDOW_MS);
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || DEFAULT_MAX_REQUESTS);

// Object to store request counts by IP and endpoint
const requestStore = {};

// Object to store endpoint-specific rate limits
let endpointLimits = {};

// Path to the configuration file (dynamic rate limits)
const configPath = path.join(process.cwd(), 'rate-limits.json');

// Load endpoint-specific rate limits if available
const loadEndpointLimits = () => {
  try {
    if (fs.existsSync(configPath)) {
      const configData = fs.readFileSync(configPath, 'utf8');
      endpointLimits = JSON.parse(configData);
      console.log('Loaded rate limit configuration:', endpointLimits);
    }
  } catch (err) {
    console.error('Error loading rate limit configuration:', err);
  }
};

// Initialize by loading configuration
loadEndpointLimits();

// Function to log throttled requests
const logThrottledRequest = (req, endpoint, ip) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    ip,
    endpoint,
    method: req.method,
    headers: req.headers
  };
  
  // Write to log file
  fs.appendFile(
    path.join(process.cwd(), 'throttled-requests.log'),
    JSON.stringify(logEntry) + '\n',
    err => {
      if (err) console.error('Error writing to throttle log:', err);
    }
  );
  
  // Could also log to console or a database
  console.warn(`[RATE LIMIT] ${timestamp} - IP: ${ip}, Endpoint: ${endpoint}`);
};

// Cleanup function to remove old entries (runs every minute)
setInterval(() => {
  const now = Date.now();
  for (const key in requestStore) {
    if (now - requestStore[key].timestamp > WINDOW_MS) {
      delete requestStore[key];
    }
  }
}, 60000);

// Rate limiting middleware
export const rateLimiter = (req, res, next) => {
  // Get client IP
  const ip = req.ip || 
             req.connection.remoteAddress || 
             req.headers['x-forwarded-for'] || 
             'unknown';
  
  // Get endpoint (path without query parameters)
  const endpoint = req.originalUrl.split('?')[0];
  
  // Create a unique key for this IP + endpoint combination
  const key = `${ip}:${endpoint}`;
  
  // Get current timestamp
  const now = Date.now();
  
  // Check if this is a new request in the window
  if (!requestStore[key] || now - requestStore[key].timestamp > WINDOW_MS) {
    requestStore[key] = {
      count: 1,
      timestamp: now
    };
    return next();
  }
  
  // Increment request count
  requestStore[key].count += 1;
  
  // Determine limit for this endpoint
  let limit = MAX_REQUESTS;
  
  // Check for endpoint-specific limit
  for (const pattern in endpointLimits) {
    if (endpoint.includes(pattern) || new RegExp(pattern).test(endpoint)) {
      limit = endpointLimits[pattern];
      break;
    }
  }
  
  // If under limit, allow request
  if (requestStore[key].count <= limit) {
    return next();
  }
  
  // Log the throttled request
  logThrottledRequest(req, endpoint, ip);
  
  // Return 429 Too Many Requests
  return res.status(429).json({
    success: false,
    error: DEFAULT_MESSAGE,
    retryAfter: Math.ceil((requestStore[key].timestamp + WINDOW_MS - now) / 1000)
  });
};

/**
 * @swagger
 * components:
 *   schemas:
 *     RateLimitConfig:
 *       type: object
 *       properties:
 *         endpoint:
 *           type: integer
 *           description: Maximum number of requests allowed in the time window
 *           example:
 *             "/api/products": 200
 *             "/api/auth": 20
 *       description: An object mapping API endpoints to their rate limits
 */

/**
 * @swagger
 * /api/admin/rate-limits/reload:
 *   get:
 *     summary: Reload rate limits from configuration file
 *     description: Reloads endpoint-specific rate limits from the configuration file
 *     tags:
 *       - Rate Limiting
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Rate limits reloaded successfully
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
 *                   example: "Rate limits reloaded"
 *                 currentLimits:
 *                   $ref: '#/components/schemas/RateLimitConfig'
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Admin privileges required
 */
export const reloadRateLimits = (req, res) => {
  loadEndpointLimits();
  res.status(200).json({
    success: true,
    message: 'Rate limits reloaded',
    currentLimits: endpointLimits
  });
};

/**
 * @swagger
 * /api/admin/rate-limits/update:
 *   post:
 *     summary: Update rate limits configuration
 *     description: Updates and saves endpoint-specific rate limits to the configuration file
 *     tags:
 *       - Rate Limiting
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RateLimitConfig'
 *     responses:
 *       200:
 *         description: Rate limits updated successfully
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
 *                   example: "Rate limits updated successfully"
 *                 currentLimits:
 *                   $ref: '#/components/schemas/RateLimitConfig'
 *       400:
 *         description: Invalid rate limits format
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Admin privileges required
 *       500:
 *         description: Server error updating rate limits
 */
export const updateRateLimits = (req, res) => {
  try {
    const newLimits = req.body;
    
    // Validate input
    if (typeof newLimits !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Invalid rate limits format'
      });
    }
    
    // Update the limits
    endpointLimits = { ...newLimits };
    
    // Save to file
    fs.writeFileSync(configPath, JSON.stringify(endpointLimits, null, 2), 'utf8');
    
    return res.status(200).json({
      success: true,
      message: 'Rate limits updated successfully',
      currentLimits: endpointLimits
    });
  } catch (err) {
    console.error('Error updating rate limits:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update rate limits'
    });
  }
};