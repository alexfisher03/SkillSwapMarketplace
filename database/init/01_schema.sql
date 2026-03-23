CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE course_cache (
  cache_id SERIAL PRIMARY KEY,
  term_code VARCHAR(32) NOT NULL,
  course_code VARCHAR(32) NOT NULL,
  course_title VARCHAR(500) NOT NULL,
  payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  hit_count INTEGER NOT NULL DEFAULT 0,
  UNIQUE (term_code, course_code)
);

CREATE INDEX course_cache_term_course_idx ON course_cache (term_code, course_code);

CREATE TABLE listings (
  listing_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
  course_cache_id INTEGER REFERENCES course_cache (cache_id) ON DELETE SET NULL,
  listing_type VARCHAR(64) NOT NULL,
  category VARCHAR(32) NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  course_code VARCHAR(32),
  term_code VARCHAR(32),
  section_number VARCHAR(32),
  section_class_number VARCHAR(32),
  section_instructor VARCHAR(255),
  section_meeting VARCHAR(255),
  section_campus VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT listings_category_check CHECK (category IN ('course', 'misc'))
);

CREATE INDEX listings_user_id_idx ON listings (user_id);
CREATE INDEX listings_created_at_idx ON listings (created_at DESC);
