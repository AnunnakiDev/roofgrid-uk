const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const authRoutes = require('./routes/auth');
const tileRoutes = require('./routes/tiles');
const projectRoutes = require('./routes/projects');

const app = express();
const port = process.env.PORT || 5000;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'roofgrid_uk',
  password: 'password1234', // Replace with your actual PostgreSQL password
  port: 5000,
});

// Test the database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to PostgreSQL:', err.stack);
    process.exit(1);
  } else {
    console.log('Successfully connected to PostgreSQL');
    release();
  }
});

app.use(cors());
app.use(express.json());

authRoutes.setDatabase(pool);
tileRoutes.setDatabase(pool);
projectRoutes.setDatabase(pool);

app.use('/api/auth', authRoutes);
app.use('/api/tiles', tileRoutes);
app.use('/api/projects', projectRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});