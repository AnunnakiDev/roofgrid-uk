const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Hardcoded admin login for development
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';
const ADMIN_ROLE = 'admin';

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  console.log('Login request received:', { username });

  try {
    // Hardcoded admin login for development
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      console.log('Hardcoded admin login successful');
      const token = jwt.sign(
        { id: 1, username: ADMIN_USERNAME, role: ADMIN_ROLE },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      console.log('Token generated:', token);
      return res.json({ token, role: ADMIN_ROLE });
    }

    // Database-based login
    console.log('Querying database for user');
    const query = 'SELECT * FROM users WHERE username = $1';
    const result = await pool.query(query, [username]);
    console.log('Query result:', result.rows);

    if (result.rows.length === 0) {
      console.log('User not found');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    console.log('Comparing passwords');
    const match = await bcrypt.compare(password, user.password);
    console.log('Password comparison result:', match);

    if (!match) {
      console.log('Password does not match');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('Generating JWT token');
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    console.log('Token generated:', token);
    res.json({ token, role: user.role });
  } catch (err) {
    console.error('Error in POST /auth/login:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;