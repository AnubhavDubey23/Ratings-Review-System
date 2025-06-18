const db = require('../models/db');

exports.addReview = async (req, res) => {
  const { email, productId, rating, reviewText } = req.body;
  const photoUrl = req.uploadedPhoto?.url || null; // Using Cloudinary URL instead of local path

  if (!email || !productId || (!rating && !reviewText)) {
    return res.status(400).json({ message: 'Please provide required fields.' });
  }

  try {
    // Check or create user
    const userResult = await db.query('SELECT id FROM users WHERE email = $1', [
      email,
    ]);

    let userId;
    if (userResult.rows.length === 0) {
      const insertResult = await db.query(
        'INSERT INTO users (email) VALUES ($1) RETURNING id',
        [email]
      );
      userId = insertResult.rows[0].id;
    } else {
      userId = userResult.rows[0].id;
    }

    // Prevent multiple reviews
    const existingResult = await db.query(
      'SELECT * FROM reviews WHERE user_id = $1 AND product_id = $2',
      [userId, productId]
    );

    if (existingResult.rows.length > 0) {
      return res.status(400).json({
        message: 'You already reviewed this product.',
      });
    }

    // Insert review
    await db.query(
      `INSERT INTO reviews 
       (user_id, product_id, rating, review_text, photo_path) 
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, productId, rating || null, reviewText || null, photoUrl]
    );

    res.json({
      message: 'Review submitted successfully.',
      photoUrl, // Return the Cloudinary URL to frontend
    });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({
      message: 'Failed to submit review. Please try again.',
    });
  }
};

exports.getReviewsByProduct = async (req, res) => {
  const { productId } = req.params;

  try {
    const result = await db.query(
      `SELECT u.email, r.rating, r.review_text, r.photo_path, r.created_at
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.product_id = $1
       ORDER BY r.created_at DESC`,
      [productId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({
      message: 'Failed to fetch reviews.',
    });
  }
};
