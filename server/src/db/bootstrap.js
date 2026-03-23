const { pool } = require('./pool');

async function ensureSchema() {
  await pool.query(`
    ALTER TABLE listings
    ADD COLUMN IF NOT EXISTS term_code VARCHAR(32),
    ADD COLUMN IF NOT EXISTS section_number VARCHAR(32),
    ADD COLUMN IF NOT EXISTS section_class_number VARCHAR(32),
    ADD COLUMN IF NOT EXISTS section_instructor VARCHAR(255),
    ADD COLUMN IF NOT EXISTS section_meeting VARCHAR(255),
    ADD COLUMN IF NOT EXISTS section_campus VARCHAR(255)
  `);
}

module.exports = { ensureSchema };
