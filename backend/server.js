const express = require('express');
const cors = require('cors');
const path = require('path');
const reviewRoutes = require('./routes/reviews');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(
  cors({
     origin: [
    'http://localhost:3000',              // For local development
    'https://ratings-review-system-rn1e.onrender.com'  // Render backend URL
  ],
  methods: ['GET', 'POST'],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));  

// Routes
app.use('/api/reviews', reviewRoutes);
app.use(express.static(path.join(__dirname, '../frontend')));

// Routes
app.use('/api/reviews', reviewRoutes);

// Handle frontend routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Increase timeout to 30 seconds (Render's default is only 5s)
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

server.setTimeout(30000);  // 30 seconds