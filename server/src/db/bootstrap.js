const { pool } = require('./pool');

async function ensureSchema() {
  // keep older databases compatible
  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS display_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS self_proclaimed_skills TEXT[] DEFAULT '{}'
  `);

  await pool.query(`
    UPDATE users
    SET display_name = COALESCE(NULLIF(display_name, ''), split_part(email, '@', 1))
    WHERE display_name IS NULL OR display_name = ''
  `);

  await pool.query(`
    ALTER TABLE users
    ALTER COLUMN display_name SET NOT NULL,
    ALTER COLUMN self_proclaimed_skills SET DEFAULT '{}',
    ALTER COLUMN self_proclaimed_skills SET NOT NULL
  `);

  await pool.query(`
    ALTER TABLE listings
    ADD COLUMN IF NOT EXISTS term_code VARCHAR(32),
    ADD COLUMN IF NOT EXISTS section_number VARCHAR(32),
    ADD COLUMN IF NOT EXISTS section_class_number VARCHAR(32),
    ADD COLUMN IF NOT EXISTS section_instructor VARCHAR(255),
    ADD COLUMN IF NOT EXISTS section_meeting VARCHAR(255),
    ADD COLUMN IF NOT EXISTS section_campus VARCHAR(255),
    ADD COLUMN IF NOT EXISTS status VARCHAR(32) NOT NULL DEFAULT 'open'
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS listing_interests (
      interest_id SERIAL PRIMARY KEY,
      listing_id INTEGER NOT NULL REFERENCES listings(listing_id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(listing_id, user_id)
    )
  `);
}

module.exports = { ensureSchema };
