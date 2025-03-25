const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware.authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const query = 'SELECT * FROM projects WHERE user_id = $1';
  try {
    const result = await pool.query(query, [userId]);
    // Parse JSONB fields
    const projects = result.rows.map(project => ({
      ...project,
      input_data: project.input_data ? JSON.parse(project.input_data) : null,
      results: project.results ? JSON.parse(project.results) : null,
      roof_details: project.roof_details ? JSON.parse(project.roof_details) : null,
      calculations: project.calculations ? JSON.parse(project.calculations) : null,
    }));
    res.json(projects);
  } catch (err) {
    console.error('Error in GET /projects:', err);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

router.post('/', authMiddleware.authenticateToken, async (req, res) => {
  const { title, input_data, results } = req.body;
  const userId = req.user.id;

  const query = `
    INSERT INTO projects (user_id, title, input_data, results)
    VALUES ($1, $2, $3, $4)
    RETURNING id
  `;
  try {
    const result = await pool.query(query, [userId, title, input_data, results]);
    res.status(201).json({ id: result.rows[0].id });
  } catch (err) {
    console.error('Error in POST /projects:', err);
    res.status(500).json({ error: 'Failed to save project' });
  }
});

router.delete('/:id', authMiddleware.authenticateToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  try {
    const result = await pool.query('DELETE FROM projects WHERE id = $1 AND user_id = $2', [id, userId]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    console.error('Error in DELETE /projects/:id:', err);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

module.exports = router;