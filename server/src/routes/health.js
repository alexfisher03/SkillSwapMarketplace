const express = require('express');
const { pool } = require('../db/pool');

const router = express.Router();

router.get('/health', async (req, res) => {
  let dbOk = false;
  try {
    await pool.query('SELECT 1');
    dbOk = true;
  } catch (err) {
    dbOk = false;
  }
  res.json({ status: 'ok', database: dbOk });
});

module.exports = router;
