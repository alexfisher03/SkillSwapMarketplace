const { pool } = require('./pool');

async function ensureSchema() {
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
