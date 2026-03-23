import { useCallback, useEffect, useState } from 'react';
import ListingCard from '../components/ListingCard.jsx';
import ListingForm from '../components/ListingForm.jsx';
import { getListings } from '../api/listings.js';

export default function SkillSwapPage({ currentUser, defaultTerm }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setError('');
    setRows(null);
    getListings()
      .then(setRows)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="mt-4">
      <h1 className="h4 mb-4">Skill Swap</h1>
      <ListingForm currentUser={currentUser} defaultTerm={defaultTerm} onCreated={load} />
      {error ? <p className="text-danger small">{error}</p> : null}
      {rows === null ? <p className="text-muted small">Loading...</p> : null}
      {Array.isArray(rows) && rows.length === 0 ? (
        <p className="text-muted small">No listings yet.</p>
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
