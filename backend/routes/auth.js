const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const config = require('../config');
const router = express.Router();

const db = new sqlite3.Database('./roofgrid.db');

router.post('/register', (req, res) => {
    const { username, password } = req.body;
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) return res.status(500).json({ error: err.message });
      db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, hash, 'user'], function(err) {
        if (err) return res.status(400).json({ error: 'Username already exists' });
        res.status(201).json({ id: this.lastID });
      });
    });
  });

  router.post('/login', (req, res) => {
    const { username, password } = req.body;
    console.log('Login attempt:', { username }); // Debug log
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
      if (err) {
        console.error('Database error:', err.message); // Debug log
        return res.status(500).json({ error: err.message });
      }
      if (!user) {
        console.log('User not found:', username); // Debug log
        return res.status(401).json({ error: 'Invalid credentials' });
      }
  
      bcrypt.compare(password, user.password, (err, match) => {
        if (err) {
          console.error('Bcrypt error:', err.message); // Debug log
          return res.status(500).json({ error: err.message });
        }
        if (!match) {
          console.log('Password mismatch for user:', username); // Debug log
          return res.status(401).json({ error: 'Invalid credentials' });
        }
  
        const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1h' });
        console.log('Login successful:', { username, role: user.role }); // Debug log
        res.json({ token, role: user.role });
      });
    });
  });
  
module.exports = router;