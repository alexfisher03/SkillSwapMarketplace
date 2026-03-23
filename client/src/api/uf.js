import { apiUrl } from './base.js';
import { requestJson } from './http.js';

export function searchCourses(query, term) {
  const url = new URL(apiUrl('/api/uf/courses/search'), window.location.origin);
  url.searchParams.set('q', query);
  if (term) url.searchParams.set('term', term);
  const target = url.origin === window.location.origin ? `${url.pathname}${url.search}` : url.toString();
  return requestJson(target);
}
