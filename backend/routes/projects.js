const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const router = express.Router();
const { authenticate } = require('../middleware/auth');

const db = new sqlite3.Database('./roofgrid.db');

router.get('/', authenticate, (req, res) => {
  const userId = req.user.id;
  db.all('SELECT * FROM projects WHERE user_id = ?', [userId], (err, rows) => {
    if (err) {
      console.error('Error fetching projects:', err);
      return res.status(500).json({ error: 'Failed to fetch projects' });
    }
    res.json(rows);
  });
});

router.post('/', authenticate, (req, res) => {
  const { name, date, details } = req.body;
  const userId = req.user.id;
  // Validate required fields
  if (!name || !date || !details) {
    return res.status(400).json({ error: 'Name, date, and details are required' });
  }
  // Validate details JSON
  try {
    JSON.parse(details);
  } catch (err) {
    return res.status(400).json({ error: 'Details must be a valid JSON string' });
  }
  db.run('INSERT INTO projects (user_id, name, date, details) VALUES (?, ?, ?, ?)', [userId, name, date, details], function(err) {
    if (err) {
      console.error('Error creating project:', err);
      return res.status(500).json({ error: 'Failed to create project' });
    }
    res.status(201).json({ id: this.lastID });
  });
});

router.delete('/:id', authenticate, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  db.run('DELETE FROM projects WHERE id = ? AND user_id = ?', [id, userId], function(err) {
    if (err) {
      console.error('Error deleting project:', err);
      return res.status(500).json({ error: 'Failed to delete project' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Project not found or you do not have permission to delete it' });
    }
    res.status(200).json({ message: 'Project deleted successfully' });
  });
});

module.exports = router;