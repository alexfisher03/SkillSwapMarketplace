export async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await response.json()
    : null;
  if (!response.ok) {
    const message =
      (data && (data.detail || data.error)) || `HTTP ${response.status}`;
    throw new Error(message);
  }
  return data;
}
