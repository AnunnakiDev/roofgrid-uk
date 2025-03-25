const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'roofgrid_uk',
  password: 'password1234', // Replace with your PostgreSQL password
  port: 5432,
});

module.exports = pool;