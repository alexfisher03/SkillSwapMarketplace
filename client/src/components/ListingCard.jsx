import { useState } from 'react';
import { setListingStatus, expressInterest, removeInterest } from '../api/listings.js';
import { Link } from 'react-router-dom';

export default function ListingCard({ listing, currentUser, onStatusChange, onEdit, showInterestCount }) {
  const [revealedEmail, setRevealedEmail] = useState(null);
  const [interested, setInterested] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isOwner = currentUser?.user_id === listing.user_id;
  const isClosed = listing.status === 'closed';
  const createdAt = listing.created_at ? new Date(listing.created_at).toLocaleDateString() : null;
  const typeClass = `listing-badge-${listing.listing_type || 'offer'}`;
  const categoryClass = listing.category === 'course' ? 'badge-category-course' : 'badge-category-misc';

  const handleToggleStatus = async () => {
    setLoading(true);
    setError('');
    try {
      const newStatus = isClosed ? 'open' : 'closed';
      await setListingStatus(listing.listing_id, newStatus, currentUser?.token);
      onStatusChange?.(listing.listing_id, newStatus);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInterest = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await expressInterest(listing.listing_id, currentUser?.token);
      setRevealedEmail(result.poster_email);
      setInterested(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveInterest = async () => {
    setLoading(true);
    setError('');
    try {
      await removeInterest(listing.listing_id, currentUser?.token);
      setRevealedEmail(null);
      setInterested(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`card listing-card h-100 shadow-sm ${isClosed ? 'opacity-75' : ''}`}>
      <div className="card-body d-flex flex-column gap-3">
        <div className="d-flex justify-content-between align-items-start gap-2">
          <div>
            <h3 className="h6 card-title mb-1">{listing.title}</h3>
            <p className="small text-muted mb-0">
            Posted by <Link to={`/user/${listing.user_id}`}>{listing.creator_display_name}</Link>
            </p>
          </div>
          <div className="d-flex flex-column align-items-end gap-1">
            <span className={`badge ${typeClass} text-uppercase small py-2 px-3`}>
              {listing.listing_type}
            </span>
            {isClosed && (
              <span className="badge bg-secondary text-uppercase small py-1 px-2">
                Closed
              </span>
            )}
          </div>
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

        <p className="card-text small-muted flex-grow-1">
          {listing.description || 'No additional details.'}
        </p>

        {showInterestCount && isOwner && (
          <p className="small text-muted mb-0">
            {listing.interest_count ?? 0} {Number(listing.interest_count) === 1 ? 'person' : 'people'} interested
          </p>
        )}

        <div className="d-flex justify-content-between align-items-center small text-muted">
          <span>{createdAt ? `Posted ${createdAt}` : 'Posted recently'}</span>
          {listing.category === 'course' && listing.section_meeting ? (
            <span>{listing.section_meeting}</span>
          ) : null}
        </div>

        {error && <p className="small text-danger mb-0">{error}</p>}

        {revealedEmail && (
          <div className="alert alert-success py-2 mb-0 small">
            Contact: <a href={`mailto:${revealedEmail}`}>{revealedEmail}</a>
          </div>
        )}

        {currentUser && (
          <div className="d-flex gap-2 mt-auto flex-wrap">
            {isOwner ? (
              <>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => onEdit?.(listing)}
                  disabled={loading}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${isClosed ? 'btn-outline-success' : 'btn-outline-secondary'}`}
                  onClick={handleToggleStatus}
                  disabled={loading}
                >
                  {isClosed ? 'Reopen' : 'Close listing'}
                </button>
              </>
            ) : !isClosed && (
              interested ? (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={handleRemoveInterest}
                  disabled={loading}
                >
                  Remove interest
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary"
                  onClick={handleInterest}
                  disabled={loading}
                >
                  I'm Interested
                </button>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}