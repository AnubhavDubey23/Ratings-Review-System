// backend/models/db.js
const { Pool } = require('pg');

// Create a new PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for Render's PostgreSQL
  },
});

// Test the database connection on startup
pool
  .connect()
  .then((client) => {
    console.log('Connected to PostgreSQL database');
    client.release();

    // Initialize database schema
    return initDatabase();
  })
  .catch((err) => {
    console.error('Database connection failed:', err);
  });

// Initialize database tables
async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT
      );
      
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        rating INTEGER CHECK (rating BETWEEN 1 AND 5),
        review_text TEXT,
        photo_path TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (user_id, product_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      );
    `);
    console.log('Database tables initialized');
  } catch (err) {
    console.error('Failed to initialize database tables:', err);
  }
}

// Export the query function
module.exports = {
  query: async (text, params) => {
    try {
      const start = Date.now();
      const result = await pool.query(text, params);
      const duration = Date.now() - start;
      console.log('Executed query', { text, duration, rows: result.rowCount });
      return result;
    } catch (err) {
      console.error('Database query error:', err);
      throw err;
    }
  },

  // Helper function to get a single row
  get: async (text, params) => {
    const result = await pool.query(text, params);
    return result.rows[0];
  },
};
