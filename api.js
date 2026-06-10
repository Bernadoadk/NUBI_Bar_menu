import CONFIG from './config.js';

const API_BASE = CONFIG.API_URL || '';

function getAuthHeaders() {
  const token = localStorage.getItem('nubi_admin_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...options.headers
    }
  });

  if (response.status === 204) return null;

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status})`);
  }

  return data;
}

export const api = {
  getMenu: () => request('/api/menu'),
  login: (email, password) => request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  }),
  getMe: () => request('/api/auth/me'),
  getSections: () => request('/api/sections'),
  getSubsections: (sectionId) => request(`/api/subsections?section_id=${sectionId}`),
  createSubsection: (data) => request('/api/subsections', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateSubsection: (id, data) => request(`/api/subsections/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  deleteSubsection: (id) => request(`/api/subsections/${id}`, { method: 'DELETE' }),
  getItems: (sectionId) => request(`/api/items?section_id=${sectionId}`),
  getItem: (id) => request(`/api/items/${id}`),
  createItem: (data) => request('/api/items', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateItem: (id, data) => request(`/api/items/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  toggleItemVisibility: (id, isVisible) => request(`/api/items/${id}/visibility`, {
    method: 'PATCH',
    body: JSON.stringify({ is_visible: isVisible })
  }),
  deleteItem: (id) => request(`/api/items/${id}`, { method: 'DELETE' })
};
