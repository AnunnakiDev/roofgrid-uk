const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

let pool;
router.setDatabase = (db) => {
  console.log('Setting database pool in tile routes');
  pool = db;
};

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tiles');
    const parsedRows = result.rows.map(row => {
      try {
        row.headlap = row.headlap; // Already a JSONB object in PostgreSQL
      } catch (parseError) {
        console.error(`Failed to parse headlap for tile ${row.id}:`, parseError.message);
        row.headlap = {};
      }
      return row;
    });
    res.json(parsedRows);
  } catch (err) {
    console.error('Error in GET /tiles:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  const {
    name,
    type,
    length,
    width,
    eave_tile_length,
    headlap,
    ridge_offset,
    batten_spacing,
    tile_count,
    chalk_marks,
    bond,
    under_course_length,
  } = req.body;

  const query = `
    INSERT INTO tiles (name, type, length, width, eave_tile_length, headlap, ridge_offset, batten_spacing, tile_count, chalk_marks, bond, under_course_length)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING id
  `;
  try {
    const result = await pool.query(query, [
      name,
      type,
      length,
      width,
      eave_tile_length,
      headlap,
      ridge_offset,
      batten_spacing,
      tile_count,
      chalk_marks,
      bond,
      under_course_length,
    ]);
    res.status(201).json({ id: result.rows[0].id });
  } catch (err) {
    console.error('Error in POST /tiles:', err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const {
    name,
    type,
    length,
    width,
    eave_tile_length,
    headlap,
    ridge_offset,
    batten_spacing,
    tile_count,
    chalk_marks,
    bond,
    under_course_length,
  } = req.body;

  const query = `
    UPDATE tiles
    SET name = $1, type = $2, length = $3, width = $4, eave_tile_length = $5, headlap = $6,
        ridge_offset = $7, batten_spacing = $8, tile_count = $9, chalk_marks = $10, bond = $11, under_course_length = $12
    WHERE id = $13
    RETURNING *
  `;
  try {
    const result = await pool.query(query, [
      name,
      type,
      length,
      width,
      eave_tile_length,
      headlap,
      ridge_offset,
      batten_spacing,
      tile_count,
      chalk_marks,
      bond,
      under_course_length,
      id,
    ]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Tile not found' });
    }
    res.json({ message: 'Tile updated successfully' });
  } catch (err) {
    console.error('Error in PUT /tiles/:id:', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM tiles WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Tile not found' });
    }
    res.json({ message: 'Tile deleted successfully' });
  } catch (err) {
    console.error('Error in DELETE /tiles/:id:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;