const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const { authenticate } = require('../middleware/auth');

// GET /api/users/:userId - Fetch a user's profile
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    // CHANGED: Use user_id and grab the display_name
    const result = await pool.query(
      'SELECT user_id, email, display_name, self_proclaimed_skills FROM users WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/users/:userId/skills - Update user skills
router.patch('/:userId/skills', authenticate, async (req, res) => {
  const { userId } = req.params;
  const { skills } = req.body; 

  // SECURITY CHECK: Ensure the token ID matches the URL ID
  // (req.user is provided by your authenticate middleware)
  if (req.user.user_id !== Number(userId)) {
    return res.status(403).json({ error: 'Unauthorized: You can only edit your own profile' });
  }
  
  try {
    // CHANGED: Update WHERE user_id = $2 and return the proper columns
    const result = await pool.query(
      'UPDATE users SET self_proclaimed_skills = $1 WHERE user_id = $2 RETURNING user_id, email, display_name, self_proclaimed_skills',
      [skills, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating skills:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;