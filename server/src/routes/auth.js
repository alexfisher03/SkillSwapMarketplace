const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../db/pool');

const router = express.Router();

router.post('/signup', async (req, res) => {
  const body = req.body || {};
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const displayName = typeof body.display_name === 'string' ? body.display_name.trim() : '';

  if (!email || !password || !displayName) {
    res.status(400).json({ error: 'missing_fields' });
    return;
  }
  if (!email.includes('@')) {
    res.status(400).json({ error: 'invalid_email' });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: 'password_too_short' });
    return;
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, display_name)
       VALUES ($1, $2, $3)
       RETURNING user_id, email, display_name, created_at`,
      [email, passwordHash, displayName]
    );
    res.status(201).json({ user: result.rows[0] });
  } catch (err) {
    if (err && err.code === '23505') {
      res.status(409).json({ error: 'email_already_exists' });
      return;
    }
    res.status(500).json({
      error: 'database_error',
      detail: err && err.message ? err.message : String(err),
    });
  }
});

router.post('/login', async (req, res) => {
  const body = req.body || {};
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!email || !password) {
    res.status(400).json({ error: 'missing_fields' });
    return;
  }

  try {
    const result = await pool.query(
      `SELECT user_id, email, display_name, password_hash
       FROM users
       WHERE email = $1`,
      [email]
    );
    if (result.rowCount === 0) {
      res.status(401).json({ error: 'invalid_credentials' });
      return;
    }
    const user = result.rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      res.status(401).json({ error: 'invalid_credentials' });
      return;
    }
    res.json({
      user: {
        user_id: user.user_id,
        email: user.email,
        display_name: user.display_name,
      },
    });
  } catch (err) {
    res.status(500).json({
      error: 'database_error',
      detail: err && err.message ? err.message : String(err),
    });
  }
});

module.exports = router;
