export function apiUrl(path) {
  const p = path.startsWith('/') ? path : `/${path}`;
  const base = import.meta.env.VITE_API_BASE_URL;
  if (typeof base === 'string' && base.trim()) {
    return `${base.trim().replace(/\/$/, '')}${p}`;
  }
  return p;
}
