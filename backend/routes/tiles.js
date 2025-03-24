const express = require('express');
const router = express.Router();
const db = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');

// Assuming db is passed from index.js
let database;
router.setDatabase = (db) => {
  database = db;
};

// Middleware to authenticate token
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

// Middleware to require admin role
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// GET all tiles
router.get('/', authenticateToken, requireAdmin, (req, res) => {
  database.all('SELECT * FROM tiles', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    // Parse the headlap field for each row
    const parsedRows = rows.map(row => {
      try {
        row.headlap = JSON.parse(row.headlap);
      } catch (parseError) {
        console.error(`Failed to parse headlap for tile ${row.id}:`, parseError.message);
        row.headlap = {}; // Fallback to an empty object
      }
      return row;
    });
    res.json(parsedRows);
  });
});

// POST a new tile
router.post('/', authenticateToken, requireAdmin, (req, res) => {
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
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  database.run(
    query,
    [
      name,
      type,
      length,
      width,
      eave_tile_length,
      JSON.stringify(headlap), // Store headlap as a JSON string
      ridge_offset,
      batten_spacing,
      tile_count,
      chalk_marks,
      bond,
      under_course_length,
    ],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ id: this.lastID });
    }
  );
});

// PUT (update) a tile
router.put('/:id', authenticateToken, requireAdmin, (req, res) => {
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
    SET name = ?, type = ?, length = ?, width = ?, eave_tile_length = ?, headlap = ?,
        ridge_offset = ?, batten_spacing = ?, tile_count = ?, chalk_marks = ?, bond = ?, under_course_length = ?
    WHERE id = ?
  `;
  database.run(
    query,
    [
      name,
      type,
      length,
      width,
      eave_tile_length,
      JSON.stringify(headlap),
      ridge_offset,
      batten_spacing,
      tile_count,
      chalk_marks,
      bond,
      under_course_length,
      id,
    ],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Tile not found' });
      }
      res.json({ message: 'Tile updated successfully' });
    }
  );
});

// DELETE a tile
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  database.run('DELETE FROM tiles WHERE id = ?', [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Tile not found' });
    }
    res.json({ message: 'Tile deleted successfully' });
  });
});

module.exports = router;