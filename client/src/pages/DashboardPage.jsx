import { useEffect, useState } from 'react';
import ListingCard from '../components/ListingCard.jsx';
import { getListings } from '../api/listings.js';

export default function DashboardPage({ currentUser }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentUser?.user_id) return;
    getListings({ user_id: currentUser.user_id })
      .then(setRows)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, [currentUser]);

  return (
    <div className="mt-4">
      <div className="page-hero rounded-4 p-4 mb-4">
        <h1 className="h4 mb-2">Dashboard</h1>
        <p className="mb-0 text-muted">
          Signed in as {currentUser.display_name} ({currentUser.email}).
        </p>
      </div>
      <div className="mb-4 d-flex justify-content-between align-items-center">
        <h2 className="h6 mb-0">Your listings</h2>
        {Array.isArray(rows) && rows.length > 0 ? (
          <span className="small text-muted">{rows.length} created</span>
        ) : null}
      </div>
      {error ? <div className="alert alert-danger py-2">{error}</div> : null}
      {rows === null ? <p className="text-muted small">Loading your listings...</p> : null}
      {Array.isArray(rows) && rows.length === 0 ? (
        <div className="alert alert-secondary py-3">
          You have not created any listings yet. Head to Skill Swap to post your first offer or request.
        </div>
      ) : null}
      {Array.isArray(rows) && rows.length > 0 ? (
        <div className="row g-3">
          {rows.map((row) => (
            <div key={row.listing_id} className="col-12 col-md-6">
              <ListingCard listing={row} />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
