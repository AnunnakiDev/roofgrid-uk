const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

let pool;
router.setDatabase = (db) => {
  console.log('Setting database pool in project routes');
  pool = db;
};

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied' });

  jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret', (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error in GET /projects:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  const { title, tile_id, roof_details, calculations } = req.body;
  const query = `
    INSERT INTO projects (user_id, title, tile_id, roof_details, calculations)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id
  `;
  try {
    const result = await pool.query(query, [
      req.user.id,
      title,
      tile_id,
      roof_details,
      calculations,
    ]);
    res.status(201).json({ id: result.rows[0].id });
  } catch (err) {
    console.error('Error in POST /projects:', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM projects WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    console.error('Error in DELETE /projects/:id:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;