const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/v1/checkin', async (req, res) => {
  try {
    const { user_id, mood_score, energy_level, stress_level, primary_emotion, note, tags } = req.body;
    const query = `
      INSERT INTO mood_logs (user_id, mood_score, energy_level, stress_level, primary_emotion, note, tags)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    const values = [user_id || null, mood_score, energy_level, stress_level, primary_emotion, note, tags];
    const { rows } = await pool.query(query, values);
    res.status(201).json({ success: true, log: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/v1/analytics/trends', async (req, res) => {
  try {
    const query = `
      SELECT id, mood_score, energy_level, stress_level, primary_emotion, tags, logged_at
      FROM mood_logs
      ORDER BY logged_at DESC
      LIMIT 30;
    `;
    const { rows } = await pool.query(query);
    res.json({ logs: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
