// backend/models/db.js
const { Pool } = require('pg');
require('dotenv').config();

// Create a new PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // optional: limit the number of clients
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});


pool.on('connect', () => console.log('DB connected'));
pool.on('error', (err) => console.error('DB error', err));
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
        description TEXT,
        image_url TEXT
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

      INSERT INTO products (id, name, description, image_url) VALUES
        (1, 'Running sneakers', 'Men''s Stylish Sports Running Shoes | Lightweight Breathable Sneakers for Gym, Walking', 'https://res.cloudinary.com/dxnb81vi1/image/upload/v1750765902/shoe_podeeg.jpg'),
        (2, 'Skipping Rope', 'Boldfit Skipping Rope for Men and Women Jumping Rope With Adjustable Height', 'https://res.cloudinary.com/dxnb81vi1/image/upload/v1750765902/rope_ijhyji.jpg'),
        (3, 'Yoga Mat', 'Cockatoo Super Premium 5.5 MM Pure Natural Rubber Non Slip Yoga Mat', 'https://res.cloudinary.com/dxnb81vi1/image/upload/v1750765901/mat_nejn5p.jpg')
      ON CONFLICT (id) DO NOTHING;    
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
