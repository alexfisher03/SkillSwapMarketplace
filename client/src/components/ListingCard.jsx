export default function ListingCard({ listing }) {
  const createdAt = listing.created_at ? new Date(listing.created_at).toLocaleDateString() : null;
  const typeClass = `listing-badge-${listing.listing_type || 'offer'}`;
  const categoryClass = listing.category === 'course' ? 'badge-category-course' : 'badge-category-misc';

  return (
    <div className="card listing-card h-100 shadow-sm">
      <div className="card-body d-flex flex-column gap-3">
        <div className="d-flex justify-content-between align-items-start gap-2">
          <div>
            <h3 className="h6 card-title mb-1">{listing.title}</h3>
            <p className="small text-muted mb-0">Posted by {listing.creator_display_name}</p>
          </div>
          <span className={`badge ${typeClass} text-uppercase small py-2 px-3`}> 
            {listing.listing_type}
          </span>
        </div>
        <div>
          <span className={`badge ${categoryClass} small py-2 px-3 me-2 text-uppercase`}>
            {listing.category}
          </span>
          {listing.category === 'course' && listing.course_code && (
            <span className="small text-muted">
              {listing.course_code}
              {listing.uf_course_title ? ` · ${listing.uf_course_title}` : ''}
              {listing.section_number ? ` · Section ${listing.section_number}` : ''}
            </span>
          )}
        </div>
        <p className="card-text small-muted flex-grow-1">{listing.description || 'No additional details.'}</p>
        <div className="d-flex justify-content-between align-items-center small text-muted">
          <span>{createdAt ? `Posted ${createdAt}` : 'Posted recently'}</span>
          {listing.category === 'course' && listing.section_meeting ? (
            <span>{listing.section_meeting}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
