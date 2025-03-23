const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');

const db = new sqlite3.Database('./roofgrid.db');
const upload = multer({ dest: 'uploads/' });

router.get('/', authenticate, (req, res) => {
  db.all('SELECT * FROM tiles', (err, rows) => {
    if (err) {
      console.error('Error fetching tiles:', err);
      return res.status(500).json({ error: 'Failed to fetch tiles' });
    }
    res.json(rows);
  });
});

router.post('/', authenticate, authorize('admin'), (req, res) => {
  const { name, category, length_mm, width_mm, effective_width_mm, headlap, under_course_length_mm, gauge_min_mm, gauge_max_mm, hanging_length_mm, bonding_pattern, left_hand_tile_width_mm } = req.body;
  // Validate required fields
  if (!name || !category || !bonding_pattern) {
    return res.status(400).json({ error: 'Name, category, and bonding pattern are required' });
  }
  // Validate headlap JSON
  try {
    if (headlap) JSON.parse(headlap);
  } catch (err) {
    return res.status(400).json({ error: 'Headlap must be a valid JSON string' });
  }
  db.run(
    'INSERT INTO tiles (name, category, length_mm, width_mm, effective_width_mm, headlap, under_course_length_mm, gauge_min_mm, gauge_max_mm, hanging_length_mm, bonding_pattern, left_hand_tile_width_mm) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [name, category, length_mm, width_mm, effective_width_mm, headlap, under_course_length_mm, gauge_min_mm, gauge_max_mm, hanging_length_mm, bonding_pattern, left_hand_tile_width_mm],
    function(err) {
      if (err) {
        console.error('Error creating tile:', err);
        return res.status(500).json({ error: 'Failed to create tile' });
      }
      res.status(201).json({ id: this.lastID });
    }
  );
});

router.put('/:id', authenticate, authorize('admin'), (req, res) => {
  const { id } = req.params;
  const { name, category, length_mm, width_mm, effective_width_mm, headlap, under_course_length_mm, gauge_min_mm, gauge_max_mm, hanging_length_mm, bonding_pattern, left_hand_tile_width_mm } = req.body;
  // Validate required fields
  if (!name || !category || !bonding_pattern) {
    return res.status(400).json({ error: 'Name, category, and bonding pattern are required' });
  }
  // Validate headlap JSON
  try {
    if (headlap) JSON.parse(headlap);
  } catch (err) {
    return res.status(400).json({ error: 'Headlap must be a valid JSON string' });
  }
  db.run(
    'UPDATE tiles SET name = ?, category = ?, length_mm = ?, width_mm = ?, effective_width_mm = ?, headlap = ?, under_course_length_mm = ?, gauge_min_mm = ?, gauge_max_mm = ?, hanging_length_mm = ?, bonding_pattern = ?, left_hand_tile_width_mm = ? WHERE id = ?',
    [name, category, length_mm, width_mm, effective_width_mm, headlap, under_course_length_mm, gauge_min_mm, gauge_max_mm, hanging_length_mm, bonding_pattern, left_hand_tile_width_mm, id],
    function(err) {
      if (err) {
        console.error('Error updating tile:', err);
        return res.status(500).json({ error: 'Failed to update tile' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Tile not found' });
      }
      res.status(200).json({ message: 'Tile updated successfully' });
    }
  );
});

router.delete('/:id', authenticate, authorize('admin'), (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM tiles WHERE id = ?', [id], function(err) {
    if (err) {
      console.error('Error deleting tile:', err);
      return res.status(500).json({ error: 'Failed to delete tile' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Tile not found' });
    }
    res.status(200).json({ message: 'Tile deleted successfully' });
  });
});

/*
router.post('/import', authenticate, authorize('admin'), upload.single('file'), (req, res) => {
  const results = [];
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => {
      results.push([
        data['Name'], 
        data['Category'], 
        data['Length (mm)'], 
        data['Width (mm)'], 
        data['Effective Width (mm)'], 
        data['Headlap'], 
        data['Under-course Length (mm)'], 
        data['Gauge Min (mm)'], 
        data['Gauge Max (mm)'], 
        data['Hanging Length (mm)'], 
        data['Bonding Pattern'], 
        data['Left-hand Tile Width (mm)']
      ]);
    })
    .on('end', () => {
      db.serialize(() => {
        const stmt = db.prepare('INSERT INTO tiles (name, category, length_mm, width_mm, effective_width_mm, headlap, under_course_length_mm, gauge_min_mm, gauge_max_mm, hanging_length_mm, bonding_pattern, left_hand_tile_width_mm) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        results.forEach(row => stmt.run(row));
        stmt.finalize();
        fs.unlinkSync(req.file.path);
        res.status(200).json({ message: 'CSV imported successfully' });
      });
    });
});
*/

module.exports = router;