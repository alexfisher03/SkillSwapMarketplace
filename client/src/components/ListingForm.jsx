import { useEffect, useMemo, useRef, useState } from 'react';
import { createListing, updateListing } from '../api/listings.js';
import { searchCourses } from '../api/uf.js';

const DEBOUNCE_MS = 350;

export default function ListingForm({ currentUser, defaultTerm, onCreated, onUpdated, initialListing }) {
  const isEdit = Boolean(initialListing);

  const [listingType, setListingType] = useState(initialListing?.listing_type || 'offer');
  const [category, setCategory] = useState(initialListing?.category || 'misc');
  const [title, setTitle] = useState(initialListing?.title || '');
  const [description, setDescription] = useState(initialListing?.description || '');
  const [courseQuery, setCourseQuery] = useState(initialListing?.course_code || '');
  const [courseResults, setCourseResults] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(
    initialListing?.course_code ? { code: initialListing.course_code, title: initialListing.uf_course_title || '' } : null
  );
  const [selectedSection, setSelectedSection] = useState(
    initialListing?.section_number ? {
      sectionNumber: initialListing.section_number,
      classNumber: initialListing.section_class_number,
      instructor: initialListing.section_instructor,
      meeting: initialListing.section_meeting,
      campus: initialListing.section_campus,
    } : null
  );
  const [courseError, setCourseError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef(null);

  const resolvedTerm = useMemo(() => defaultTerm || '2261', [defaultTerm]);

  useEffect(() => {
    if (category !== 'course') {
      setCourseResults([]);
      if (!isEdit) setCourseQuery('');
      setSelectedCourse(null);
      setSelectedSection(null);
      setCourseError('');
      return;
    }
    const q = courseQuery.trim();
    if (q.length < 2) {
      setCourseResults([]);
      setCourseError('');
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      searchCourses(q, resolvedTerm)
        .then((rows) => {
          setCourseResults(Array.isArray(rows) ? rows : []);
          setCourseError('');
        })
        .catch((e) => {
          setCourseResults([]);
          setCourseError(e instanceof Error ? e.message : String(e));
        });
    }, DEBOUNCE_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [category, courseQuery, resolvedTerm, isEdit]);

  const submit = (e) => {
    e.preventDefault();
    setSubmitError('');
    if (!currentUser?.user_id) {
      setSubmitError('Login required.');
      return;
    }
    if (category === 'course' && (!selectedCourse || !selectedSection)) {
      setSubmitError('Select a UF section block.');
      return;
    }

    const payload = {
      user_id: currentUser.user_id,
      listing_type: listingType,
      category,
      title,
      description,
    };

    if (category === 'course') {
      payload.term_code = resolvedTerm;
      payload.course_code = selectedCourse.code;
      payload.course_title = selectedCourse.title;
      payload.section_number = selectedSection?.sectionNumber || '';
      payload.section_class_number = selectedSection?.classNumber || '';
      payload.section_instructor = selectedSection?.instructor || '';
      payload.section_meeting = selectedSection?.meeting || '';
      payload.section_campus = selectedSection?.campus || '';
    }

    setSubmitting(true);

    const request = isEdit
      ? updateListing(initialListing.listing_id, payload, currentUser.token)
      : createListing(payload, currentUser.token);

    request
      .then(() => {
        if (isEdit) {
          if (onUpdated) onUpdated();
        } else {
          setTitle('');
          setDescription('');
          setCourseQuery('');
          setCourseResults([]);
          setSelectedCourse(null);
          setSelectedSection(null);
          if (onCreated) onCreated();
        }
      })
      .catch((e) => {
        setSubmitError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => setSubmitting(false));
  };

  return (
    <section className="mb-5">
      <form className="card shadow-sm" onSubmit={submit}>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Type</label>
              <select
                className="form-select"
                value={listingType}
                onChange={(e) => setListingType(e.target.value)}
              >
                <option value="offer">Offer</option>
                <option value="request">Request</option>
                <option value="exchange">Exchange</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={isEdit}
              >
                <option value="misc">Misc</option>
                <option value="course">Course</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Term</label>
              <input className="form-control" value={resolvedTerm} disabled />
            </div>
            <div className="col-12">
              <label className="form-label">Title</label>
              <input
                className="form-control"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="col-12">
              <label className="form-label">Description</label>
              <textarea
                className="form-control"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {category === 'course' && (
              <>
                <div className="col-12">
                  <label className="form-label">Course code</label>
                  <input
                    className="form-control"
                    placeholder="CEN3031"
                    value={courseQuery}
                    onChange={(e) => {
                      setCourseQuery(e.target.value);
                      setSelectedCourse(null);
                      setSelectedSection(null);
                    }}
                  />
                  {courseError ? (
                    <p className="small text-danger mt-1 mb-0">{courseError}</p>
                  ) : null}
                </div>
                {courseResults.length > 0 && (
                  <div className="col-12">
                    <ul className="list-group small">
                      {courseResults.map((c) => (
                        <li key={c.code} className="list-group-item">
                          <div className="mb-2">
                            <strong>{c.code}</strong> - {c.title}
                          </div>
                          {Array.isArray(c.sections) && c.sections.length > 0 ? (
                            <div className="d-flex flex-column gap-2">
                              {c.sections.slice(0, 8).map((s) => {
                                const selected =
                                  selectedCourse?.code === c.code &&
                                  selectedSection?.classNumber === s.classNumber &&
                                  selectedSection?.sectionNumber === s.sectionNumber;
                                return (
                                  <button
                                    key={`${c.code}-${s.classNumber}-${s.sectionNumber}`}
                                    type="button"
                                    className={`btn text-start ${selected ? 'btn-primary' : 'btn-outline-secondary'}`}
                                    onClick={() => {
                                      setSelectedCourse(c);
                                      setSelectedSection(s);
                                      setCourseQuery(c.code);
                                    }}
                                  >
                                    <div>
                                      Section {s.sectionNumber || 'N/A'}
                                      {s.classNumber ? ` · Class ${s.classNumber}` : ''}
                                    </div>
                                    <div className="small">
                                      {s.instructor || 'Instructor TBD'}
                                      {s.meeting ? ` · ${s.meeting}` : ''}
                                      {s.campus ? ` · ${s.campus}` : ''}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="small text-muted mb-0">No section blocks returned.</p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {selectedCourse && selectedSection ? (
                  <div className="col-12">
                    <p className="small mb-0">
                      Selected course: <strong>{selectedCourse.code}</strong> - {selectedCourse.title}
                    </p>
                    <p className="small mb-0">
                      Selected section: {selectedSection.sectionNumber || 'N/A'}
                      {selectedSection.classNumber ? ` (Class ${selectedSection.classNumber})` : ''}
                    </p>
                    <button
                      type="button"
                      className="btn btn-link btn-sm p-0 mt-1"
                      onClick={() => {
                        setSelectedCourse(null);
                        setSelectedSection(null);
                      }}
                    >
                      Clear selection
                    </button>
                  </div>
                ) : (
                  <div className="col-12">
                    <p className="small text-muted mb-0">
                      Select one section block to post a course listing.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
          {submitError ? <p className="small text-danger mt-3 mb-0">{submitError}</p> : null}
          <button type="submit" className="btn btn-primary mt-3" disabled={submitting}>
            {submitting ? 'Saving...' : isEdit ? 'Save changes' : 'Post listing'}
          </button>
        </div>
      </form>
    </section>
  );
}