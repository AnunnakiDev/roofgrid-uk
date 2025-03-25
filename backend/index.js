require('dotenv').config();
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('JWT_SECRET:', process.env.JWT_SECRET);
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const authRoutes = require('./routes/auth');
const tileRoutes = require('./routes/tiles');
const projectRoutes = require('./routes/projects');

const app = express();
const port = process.env.PORT || 5000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Test the database connection before starting the server
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to PostgreSQL:', err.stack);
    process.exit(1);
  } else {
    console.log('Successfully connected to PostgreSQL');
    release();

    // Set up routes after successful connection
    authRoutes.setDatabase(pool);
    tileRoutes.setDatabase(pool);
    projectRoutes.setDatabase(pool);

    app.use(cors());
    app.use(express.json());

    app.use('/api/auth', authRoutes);
    app.use('/api/tiles', tileRoutes);
    app.use('/api/projects', projectRoutes);

    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  }
});