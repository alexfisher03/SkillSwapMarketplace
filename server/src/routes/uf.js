const express = require('express');

const router = express.Router();

const UF_SOC_SCHEDULE_URL =
  process.env.UF_SOC_SCHEDULE_URL ||
  'https://one.ufl.edu/apix/soc/schedule/';

function normalizeCourses(ufJson) {
  const row = Array.isArray(ufJson) ? ufJson[0] : ufJson;
  const raw = row && Array.isArray(row.COURSES) ? row.COURSES : [];
  const seen = new Set();
  const out = [];
  for (const c of raw) {
    if (!c || !c.code) continue;
    const code = String(c.code).toUpperCase();
    if (seen.has(code)) continue;
    seen.add(code);
    const sections = Array.isArray(c.sections)
      ? c.sections.map((s) => ({
          sectionNumber: s && s.number != null ? String(s.number) : '',
          classNumber:
            s && s.classNumber != null ? String(s.classNumber) : '',
          instructor:
            s &&
            Array.isArray(s.instructors) &&
            s.instructors[0] &&
            s.instructors[0].name
              ? String(s.instructors[0].name)
              : '',
          meeting:
            s && Array.isArray(s.meetTimes) && s.meetTimes.length > 0
              ? s.meetTimes
                  .map((m) => {
                    const days = m.meetDays ? String(m.meetDays) : '';
                    const start = m.startTime ? String(m.startTime) : '';
                    const end = m.endTime ? String(m.endTime) : '';
                    const room = m.room ? String(m.room) : '';
                    return [days, start && end ? `${start}-${end}` : '', room]
                      .filter(Boolean)
                      .join(' ');
                  })
                  .filter(Boolean)
                  .join(' | ')
              : '',
          campus:
            s && s.campusDescription
              ? String(s.campusDescription)
              : s && s.sectWeb
                ? String(s.sectWeb)
                : '',
        }))
      : [];
    out.push({
      code,
      courseId: c.courseId != null ? String(c.courseId) : null,
      title: c.name != null ? String(c.name) : '',
      sections,
    });
  }
  return out;
}

router.get('/uf/courses/search', async (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const term =
    typeof req.query.term === 'string' && req.query.term.trim()
      ? req.query.term.trim()
      : process.env.UF_DEFAULT_TERM || '2261';
  const category = process.env.UF_SOC_CATEGORY || 'CWSP';

  if (!q) {
    res.json([]);
    return;
  }

  const url = new URL(
    UF_SOC_SCHEDULE_URL.endsWith('/')
      ? UF_SOC_SCHEDULE_URL
      : `${UF_SOC_SCHEDULE_URL}/`
  );
  url.searchParams.set('category', category);
  url.searchParams.set('term', term);
  url.searchParams.set('last-row', '0');

  const compact = q.replace(/\s+/g, '').toUpperCase();
  if (/^[A-Z]{2,4}\d{4}$/.test(compact)) {
    url.searchParams.set('course-code', compact.toLowerCase());
  } else {
    url.searchParams.set('course-title', q);
  }

  try {
    const ufRes = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
    });
    if (!ufRes.ok) {
      res.status(502).json({
        error: 'uf_upstream_error',
        status: ufRes.status,
      });
      return;
    }
    const data = await ufRes.json();
    res.json(normalizeCourses(data));
  } catch (err) {
    res.status(502).json({
      error: 'uf_fetch_failed',
      detail: err && err.message ? err.message : String(err),
    });
  }
});

module.exports = router;
