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
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.post('/', authenticate, authorize('admin'), (req, res) => {
  const { name, category, length_mm, width_mm, effective_width_mm, headlap, under_course_length_mm, gauge_min_mm, gauge_max_mm, hanging_length_mm, bonding_pattern, left_hand_tile_width_mm } = req.body;
  db.run('INSERT INTO tiles (name, category, length_mm, width_mm, effective_width_mm, headlap, under_course_length_mm, gauge_min_mm, gauge_max_mm, hanging_length_mm, bonding_pattern, left_hand_tile_width_mm) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', 
    [name, category, length_mm, width_mm, effective_width_mm, headlap, under_course_length_mm, gauge_min_mm, gauge_max_mm, hanging_length_mm, bonding_pattern, left_hand_tile_width_mm], 
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID });
    });
});

/*
router.post('/import', authenticate, authorize('admin'), upload.single('file'), (req, res) => {
  const results = [];
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => {
      results.push([
        data['Name: Tile name (e.g., "Redland 49").'], 
        data['Category: Type of tile (e.g., "plain-tile", "slate", "interlocking-tile").'], 
        data['Length (mm): Total length of the tile.'], 
        data['Width (mm): Total width of the tile.'], 
        data['Effective Width (mm): Usable width after overlaps.'], 
        data['Headlap: Overlap at the top, stored as a JSON string for pitch ranges (e.g., {"35-45": 65, "45-60": 50}). Users can enter this as text in Excel.'], 
        data['Under-course Length (mm): For plain tiles, the length of the under-course tile.'], 
        data['Gauge Min (mm): For interlocking tiles, minimum batten spacing.'], 
        data['Gauge Max (mm): For interlocking tiles, maximum batten spacing.'], 
        data['Hanging Length (mm): For interlocking tiles, the length from the hanging point.'], 
        data['Bonding Pattern: Layout style (e.g., "cross", "straight").'], 
        data['Left-hand Tile Width (mm):  Includes Tile and Halfs.']
      ]);
    })
    .on('end', () => {
      db.serialize(() => {
        const stmt = db.prepare('INSERT INTO tiles (name, category, length_mm, width_mm, effective_width_mm, headlap, under_course_length_mm, gauge_min_mm, gauge_max_mm, hanging_length_mm, bonding_pattern, left_hand_tile_width_mm) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        results.forEach(row => stmt.run(row));
        stmt.finalize();
        fs.unlinkSync(req.file.path); // Clean up uploaded file
        res.status(200).json({ message: 'CSV imported successfully' });
      });
    });
});
*/
module.exports = router;

router.put('/:id', authenticate, authorize('admin'), (req, res) => {
  const { id } = req.params;
  const { name, category, length_mm, width_mm, effective_width_mm, headlap, under_course_length_mm, gauge_min_mm, gauge_max_mm, hanging_length_mm, bonding_pattern, left_hand_tile_width_mm } = req.body;
  db.run(
    'UPDATE tiles SET name = ?, category = ?, length_mm = ?, width_mm = ?, effective_width_mm = ?, headlap = ?, under_course_length_mm = ?, gauge_min_mm = ?, gauge_max_mm = ?, hanging_length_mm = ?, bonding_pattern = ?, left_hand_tile_width_mm = ? WHERE id = ?',
    [name, category, length_mm, width_mm, effective_width_mm, headlap, under_course_length_mm, gauge_min_mm, gauge_max_mm, hanging_length_mm, bonding_pattern, left_hand_tile_width_mm, id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(200).json({ message: 'Tile updated successfully' });
    }
  );
});