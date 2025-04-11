import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false,
  },
  // Configure pool for horizontal scaling
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle
  connectionTimeoutMillis: 2000, // Connection timeout
});

// Better error handling for pool events
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  // Don't crash the server, just log the error
  if (process.env.NODE_ENV !== 'production') {
    console.error('Database pool error:', err);
  }
});

export default pool;