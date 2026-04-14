const express = require('express');
const { pool } = require('../db/pool');
const { authenticate } = require('../middleware/auth');
const { verifyToken } = require('../utils/jwt');

const router = express.Router();

router.get('/listings', async (req, res) => {
  const requestedUserId = Number(req.query.user_id);
  const hasUserFilter = req.query.user_id !== undefined && !Number.isNaN(requestedUserId);
  const boundUserId = hasUserFilter ? requestedUserId : null;
  const authHeader = req.headers.authorization;
  let viewerUserId = null;

  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const payload = verifyToken(token);
      const parsedId = Number(payload && payload.user_id);
      if (!Number.isNaN(parsedId)) {
        viewerUserId = parsedId;
      }
    } catch (_err) {
      viewerUserId = null;
    }
  }

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
        l.status,
        COUNT(li.interest_id) AS interest_count,
        COALESCE(BOOL_OR(li.user_id = $3), FALSE) AS viewer_has_interest,
        MAX(CASE WHEN li.user_id = $3 THEN u.email ELSE NULL END) AS viewer_contact_email,
        CASE
          WHEN $3 IS NOT NULL AND l.user_id = $3 THEN COALESCE(
            JSONB_AGG(DISTINCT JSONB_BUILD_OBJECT(
              'user_id', iu.user_id,
              'display_name', iu.display_name,
              'email', iu.email
            )) FILTER (WHERE iu.user_id IS NOT NULL),
            '[]'::jsonb
          )
          ELSE '[]'::jsonb
        END AS interested_users,
        u.display_name AS creator_display_name,
        cc.course_title AS uf_course_title
      FROM listings l
      INNER JOIN users u ON u.user_id = l.user_id
      LEFT JOIN course_cache cc ON cc.cache_id = l.course_cache_id
      LEFT JOIN listing_interests li ON li.listing_id = l.listing_id
      LEFT JOIN users iu ON iu.user_id = li.user_id
      WHERE ($1::boolean = false OR l.user_id = $2)
      GROUP BY l.listing_id, u.display_name, cc.course_title
      ORDER BY l.created_at DESC`,
      [hasUserFilter, boundUserId, viewerUserId]
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

router.patch('/listings/:id/status', authenticate, async (req, res) => {
  const listingId = Number(req.params.id);
  const userId = Number(req.user && req.user.user_id);
  const { status } = req.body || {};

  if (!['open', 'closed'].includes(status)) {
    return res.status(400).json({ error: 'invalid_status' });
  }

  try {
    const result = await pool.query(
      `UPDATE listings SET status = $1
       WHERE listing_id = $2 AND user_id = $3
       RETURNING listing_id`,
      [status, listingId, userId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'not_found_or_unauthorized' });
    }
    res.json({ listing_id: listingId, status });
  } catch (err) {
    res.status(500).json({ error: 'database_error', detail: err.message });
  }
});

router.post('/listings/:id/interest', authenticate, async (req, res) => {
  const listingId = Number(req.params.id);
  const userId = Number(req.user && req.user.user_id);

  try {
    const listingResult = await pool.query(
      `SELECT l.listing_id, l.user_id, l.status, u.email AS poster_email
       FROM listings l
       INNER JOIN users u ON u.user_id = l.user_id
       WHERE l.listing_id = $1`,
      [listingId]
    );
    if (listingResult.rowCount === 0) {
      return res.status(404).json({ error: 'not_found' });
    }
    const listing = listingResult.rows[0];
    if (listing.status === 'closed') {
      return res.status(400).json({ error: 'listing_closed' });
    }
    if (listing.user_id === userId) {
      return res.status(400).json({ error: 'cannot_interest_own_listing' });
    }

    await pool.query(
      `INSERT INTO listing_interests (listing_id, user_id)
       VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [listingId, userId]
    );

    res.json({ poster_email: listing.poster_email });
  } catch (err) {
    res.status(500).json({ error: 'database_error', detail: err.message });
  }
});

router.patch('/listings/:id', authenticate, async (req, res) => {
  const listingId = Number(req.params.id);
  const userId = Number(req.user && req.user.user_id);
  const body = req.body || {};

  const listingType = typeof body.listing_type === 'string' ? body.listing_type.trim() : null;
  const title = typeof body.title === 'string' ? body.title.trim() : null;
  const description = typeof body.description === 'string' ? body.description.trim() : '';

  if (!title) return res.status(400).json({ error: 'missing_fields' });

  try {
    const result = await pool.query(
      `UPDATE listings SET
        listing_type = COALESCE($1, listing_type),
        title = $2,
        description = $3
       WHERE listing_id = $4 AND user_id = $5
       RETURNING listing_id`,
      [listingType, title, description || null, listingId, userId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'not_found_or_unauthorized' });
    }
    res.json({ listing_id: listingId });
  } catch (err) {
    res.status(500).json({ error: 'database_error', detail: err.message });
  }
});

router.delete('/listings/:id/interest', authenticate, async (req, res) => {
  const listingId = Number(req.params.id);
  const userId = Number(req.user && req.user.user_id);

  try {
    await pool.query(
      `DELETE FROM listing_interests WHERE listing_id = $1 AND user_id = $2`,
      [listingId, userId]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'database_error', detail: err.message });
  }
});

module.exports = router;
