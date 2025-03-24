const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

let pool;
router.setDatabase = (db) => {
  console.log('Setting database pool in auth routes');
  pool = db;
};

router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  console.log('Register request received:', { username });
  try {
    const hash = await bcrypt.hash(password, 10);
    console.log('Password hashed successfully');
    const result = await pool.query(
      'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id',
      [username, hash, 'user']
    );
    console.log('User registered:', result.rows[0]);
    res.status(201).json({ id: result.rows[0].id });
  } catch (err) {
    console.error('Error in /register:', err);
    res.status(400).json({ error: 'Username already exists' });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  console.log('Login request received:', { username });

  try {
    console.log('Querying database for user');
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    console.log('Query result:', result.rows);

    const user = result.rows[0];
    if (!user) {
      console.log('User not found');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

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
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '1h' }
    );
    console.log('Token generated:', token);

    res.json({ token, role: user.role });
  } catch (err) {
    console.error('Error in /login:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;