const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const router = express.Router();
const { authenticate } = require('../middleware/auth');

const db = new sqlite3.Database('./roofgrid.db');

router.get('/', authenticate, (req, res) => {
  db.all('SELECT * FROM projects WHERE user_id = ?', [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.post('/', authenticate, (req, res) => {
  const { name, details } = req.body;
  const date = new Date().toISOString();
  db.run('INSERT INTO projects (user_id, name, date, details) VALUES (?, ?, ?, ?)', 
    [req.user.id, name, date, details], 
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID });
    });
});

module.exports = router;