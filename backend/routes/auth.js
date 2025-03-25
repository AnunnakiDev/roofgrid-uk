const express = require('express');

module.exports = (pool) => {
  const router = express.Router();

  // Example route using the pool
  router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
      const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
      res.json(result.rows);
    } catch (err) {
      console.error('Error during login:', err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  return router;
};