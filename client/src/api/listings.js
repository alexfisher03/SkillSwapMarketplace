import { apiUrl } from './base.js';
import { requestJson } from './http.js';

export function getListings(params = {}) {
  const url = new URL(apiUrl('/api/listings'), window.location.origin);
  if (params.user_id) url.searchParams.set('user_id', String(params.user_id));
  const target = url.origin === window.location.origin ? `${url.pathname}${url.search}` : url.toString();
  return requestJson(target);
}

export function createListing(payload, token) {
  return requestJson(apiUrl('/api/listings'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
}

export function setListingStatus(listingId, status, token) {
  return requestJson(apiUrl(`/api/listings/${listingId}/status`), {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ status }),
  });
}

export function expressInterest(listingId, token) {
  return requestJson(apiUrl(`/api/listings/${listingId}/interest`), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

export function removeInterest(listingId, token) {
  return requestJson(apiUrl(`/api/listings/${listingId}/interest`), {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

export function updateListing(listingId, payload, token) {
  return requestJson(apiUrl(`/api/listings/${listingId}`), {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
}