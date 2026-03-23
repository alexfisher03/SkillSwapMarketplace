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
      <h1 className="h4 mb-2">Dashboard</h1>
      <p className="text-muted small mb-4">
        Signed in as {currentUser.display_name} ({currentUser.email})
      </p>
      <h2 className="h6 mb-3">Your listings</h2>
      {error ? <p className="text-danger small">{error}</p> : null}
      {rows === null ? <p className="text-muted small">Loading...</p> : null}
      {Array.isArray(rows) && rows.length === 0 ? (
        <p className="text-muted small">You have not created any listings yet.</p>
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
