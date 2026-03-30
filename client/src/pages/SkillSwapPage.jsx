import { useCallback, useEffect, useMemo, useState } from 'react';
import ListingCard from '../components/ListingCard.jsx';
import ListingForm from '../components/ListingForm.jsx';
import Modal from '../components/Modal.jsx';
import { getListings } from '../api/listings.js';

export default function SkillSwapPage({ currentUser, defaultTerm }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [initialListingType, setInitialListingType] = useState('offer');
  const [editingListing, setEditingListing] = useState(null);


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

  const openCreateModal = (type = 'offer') => {
    setInitialListingType(type);
    setIsCreateOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateOpen(false);
  };

  const handleCreated = () => {
    load();
    closeCreateModal();
  };

  const handleStatusChange = (listingId, newStatus) => {
    setRows(prev => prev.map(r =>
      r.listing_id === listingId ? { ...r, status: newStatus } : r
    ));
  };

  const filteredRows = useMemo(() => {
    if (!Array.isArray(rows)) return rows;
    const query = searchQuery.trim().toLowerCase();

    return rows.filter((row) => {
      if (categoryFilter !== 'all' && row.category !== categoryFilter) {
        return false;
      }
      if (typeFilter !== 'all' && row.listing_type !== typeFilter) {
        return false;
      }
      if (!query) return true;
      return [row.title, row.description, row.course_code, row.uf_course_title]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query));
    });
  }, [rows, categoryFilter, typeFilter, searchQuery]);

  const handleEdit = (listing) => setEditingListing(listing);
  const closeEditModal = () => setEditingListing(null);
  const handleUpdated = () => {
    load();
    closeEditModal();
  };

  return (
    <div className="mt-4">
      <div className="page-hero rounded-4 p-4 mb-4">
        <div className="row align-items-center">
          <div className="col-md-8">
            <h1 className="h3">Welcome back, {currentUser?.display_name}.</h1>
            <p className="mb-0 text-muted">
              Browse listings, post a new offer/request, and connect with other students using UF course information.
            </p>
          </div>
          <div className="col-md-4 text-md-end mt-3 mt-md-0">
            <span className="badge bg-primary py-2 px-3">
              Default term: {defaultTerm}
            </span>
          </div>
        </div>
        <div className="row mt-4 g-2">
          <div className="col-sm-6 col-lg-4">
            <button type="button" className="btn btn-primary w-100" onClick={() => openCreateModal()}>
              Create listing
            </button>
          </div>
        </div>
      </div>

      <Modal title="Create listing" visible={isCreateOpen} onClose={closeCreateModal}>
        <ListingForm
          currentUser={currentUser}
          defaultTerm={defaultTerm}
          initialListingType={initialListingType}
          onCreated={handleCreated}
        />
      </Modal>

      <Modal title="Edit listing" visible={Boolean(editingListing)} onClose={closeEditModal}>
        {editingListing && (
        <ListingForm
          currentUser={currentUser}
          defaultTerm={defaultTerm}
          initialListing={editingListing}
          onUpdated={handleUpdated}
        />
        )}
      </Modal>

      {error ? <div className="alert alert-danger py-2">{error}</div> : null}
      {rows !== null && Array.isArray(rows) && rows.length > 0 ? (
        <div className="card mb-4">
          <div className="card-body">
            <div className="row gy-3 gx-3 align-items-end">
              <div className="col-sm-4">
                <label className="form-label small mb-1">Category</label>
                <select
                  className="form-select"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="all">All categories</option>
                  <option value="misc">Misc</option>
                  <option value="course">Course</option>
                </select>
              </div>
              <div className="col-sm-4">
                <label className="form-label small mb-1">Type</label>
                <select
                  className="form-select"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="all">All types</option>
                  <option value="offer">Offer</option>
                  <option value="request">Request</option>
                  <option value="exchange">Exchange</option>
                </select>
              </div>
              <div className="col-sm-4">
                <label className="form-label small mb-1">Search</label>
                <input
                  type="search"
                  className="form-control"
                  placeholder="Search title, course code, or description"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {rows === null ? <p className="text-muted small">Loading listings...</p> : null}
      {Array.isArray(rows) && rows.length === 0 ? (
        <p className="text-muted small">No listings yet. Be the first to post one!</p>
      ) : null}
      {Array.isArray(rows) && rows.length > 0 ? (
        <>
          <div className="mb-3 d-flex justify-content-between align-items-center">
            <h2 className="h5 mb-0">Latest listings</h2>
            <span className="small text-muted">
              {filteredRows.length} of {rows.length} shown
            </span>
          </div>
          {filteredRows.length === 0 ? (
            <div className="alert alert-secondary py-3">
              No listings match the current filter. Try a broader search or reset the filters.
            </div>
          ) : (
            <div className="row g-3">
              {filteredRows.map((row) => (
                <div key={row.listing_id} className="col-12 col-md-6">
                  <ListingCard listing={row} currentUser={currentUser} onStatusChange={handleStatusChange} onEdit={handleEdit}/>
                </div>
            ))}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
