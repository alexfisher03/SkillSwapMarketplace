const express = require('express');
const { pool } = require('../db/pool');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/listings', async (req, res) => {
  const requestedUserId = Number(req.query.user_id);
  const hasUserFilter = req.query.user_id !== undefined && !Number.isNaN(requestedUserId);
  const boundUserId = hasUserFilter ? requestedUserId : null;

  try {
    const result = await pool.query(
      `SELECT
        l.listing_id,
        l.user_id,
        l.course_cache_id,
        l.listing_type,
        l.category,
        l.title,
        l.description,
        l.course_code,
        l.term_code,
        l.section_number,
        l.section_class_number,
        l.section_instructor,
        l.section_meeting,
        l.section_campus,
        l.created_at,
        u.display_name AS creator_display_name,
        cc.course_title AS uf_course_title
      FROM listings l
      INNER JOIN users u ON u.user_id = l.user_id
      LEFT JOIN course_cache cc ON cc.cache_id = l.course_cache_id
      WHERE ($1::boolean = false OR l.user_id = $2)
      ORDER BY l.created_at DESC`,
      [hasUserFilter, boundUserId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({
      error: 'database_error',
      detail: err && err.message ? err.message : String(err),
    });
  }
});

router.post('/listings', authenticate, async (req, res) => {
  const body = req.body || {};
  const userId = Number(req.user && req.user.user_id);
  const listingType = typeof body.listing_type === 'string' ? body.listing_type.trim() : '';
  const category = typeof body.category === 'string' ? body.category.trim() : '';
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const termCode = typeof body.term_code === 'string' ? body.term_code.trim() : '';
  const courseCode =
    typeof body.course_code === 'string' ? body.course_code.trim().toUpperCase() : '';
  const courseTitle = typeof body.course_title === 'string' ? body.course_title.trim() : '';
  const sectionNumber =
    typeof body.section_number === 'string' ? body.section_number.trim() : '';
  const sectionClassNumber =
    typeof body.section_class_number === 'string' ? body.section_class_number.trim() : '';
  const sectionInstructor =
    typeof body.section_instructor === 'string' ? body.section_instructor.trim() : '';
  const sectionMeeting =
    typeof body.section_meeting === 'string' ? body.section_meeting.trim() : '';
  const sectionCampus =
    typeof body.section_campus === 'string' ? body.section_campus.trim() : '';

  if (!userId || Number.isNaN(userId)) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  if (!listingType || !title) {
    res.status(400).json({ error: 'missing_fields' });
    return;
  }
  if (category !== 'course' && category !== 'misc') {
    res.status(400).json({ error: 'invalid_category' });
    return;
  }
  if (category === 'course' && (!termCode || !courseCode || !courseTitle)) {
    res.status(400).json({ error: 'course_fields_required' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const userCheck = await client.query('SELECT user_id FROM users WHERE user_id = $1', [userId]);
    if (userCheck.rowCount === 0) {
      await client.query('ROLLBACK');
      res.status(400).json({ error: 'invalid_user_id' });
      return;
    }

    let courseCacheId = null;
    let listingCourseCode = null;

    if (category === 'course') {
      const payload = JSON.stringify({
        source: 'listing_create',
        term_code: termCode,
        section_number: sectionNumber || null,
        section_class_number: sectionClassNumber || null,
      });
      const ins = await client.query(
        `INSERT INTO course_cache (term_code, course_code, course_title, payload_json, hit_count)
         VALUES ($1, $2, $3, $4::jsonb, 0)
         ON CONFLICT (term_code, course_code) DO UPDATE SET
           course_title = EXCLUDED.course_title,
           payload_json = EXCLUDED.payload_json,
           last_fetched_at = NOW()
         RETURNING cache_id`,
        [termCode, courseCode, courseTitle, payload]
      );
      courseCacheId = ins.rows[0].cache_id;
      listingCourseCode = courseCode;
    }

    const insListing = await client.query(
      `INSERT INTO listings (
        user_id,
        course_cache_id,
        listing_type,
        category,
        title,
        description,
        course_code,
        term_code,
        section_number,
        section_class_number,
        section_instructor,
        section_meeting,
        section_campus
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING listing_id`,
      [
        userId,
        courseCacheId,
        listingType,
        category,
        title,
        description || null,
        listingCourseCode,
        category === 'course' ? termCode : null,
        category === 'course' ? sectionNumber || null : null,
        category === 'course' ? sectionClassNumber || null : null,
        category === 'course' ? sectionInstructor || null : null,
        category === 'course' ? sectionMeeting || null : null,
        category === 'course' ? sectionCampus || null : null,
      ]
    );

    await client.query('COMMIT');
    res.status(201).json({ listing_id: insListing.rows[0].listing_id });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({
      error: 'database_error',
      detail: err && err.message ? err.message : String(err),
    });
  } finally {
    client.release();
  }
});

module.exports = router;
