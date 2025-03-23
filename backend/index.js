const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const config = require('./config');

const app = express();
app.use(express.json());
app.use(cors());

const db = new sqlite3.Database('./roofgrid.db', (err) => {
  if (err) console.error('Database connection error:', err);
  else console.log('Connected to SQLite database');
});

// Create tables
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      role TEXT
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS tiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      category TEXT,
      length_mm INTEGER,
      width_mm INTEGER,
      effective_width_mm INTEGER,
      headlap TEXT,
      under_course_length_mm INTEGER,
      gauge_min_mm INTEGER,
      gauge_max_mm INTEGER,
      hanging_length_mm INTEGER,
      bonding_pattern TEXT,
      left_hand_tile_width_mm INTEGER
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      name TEXT,
      date TEXT,
      details TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tiles', require('./routes/tiles'));
app.use('/api/projects', require('./routes/projects'));

app.listen(config.PORT, () => console.log(`Server running on port ${config.PORT}`));