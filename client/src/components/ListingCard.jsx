export default function ListingCard({ listing }) {
  return (
    <div className="card h-100 shadow-sm">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
          <h3 className="h6 card-title mb-0">{listing.title}</h3>
          <span className="badge text-bg-secondary text-wrap text-end">
            {listing.listing_type}
          </span>
        </div>
        <p className="card-text small mb-2">
          <span className="badge text-bg-light border me-1">{listing.category}</span>
          {listing.category === 'course' && listing.course_code && (
            <span className="text-muted">
              {listing.course_code}
              {listing.uf_course_title ? ` · ${listing.uf_course_title}` : ''}
              {listing.section_number ? ` · Section ${listing.section_number}` : ''}
            </span>
          )}
        </p>
        <p className="card-text small mb-2">{listing.description}</p>
        <p className="card-text small mb-0">
          <span className="text-muted">Posted by </span>
          {listing.creator_display_name}
        </p>
      </div>
    </div>
  );
}
