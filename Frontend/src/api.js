// Central API service - all backend calls in one place
const BASE_URL = 'http://localhost:8080/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || 'Request failed');
  }
  return json.data;
}

// ── Departments ──────────────────────────────────
export const departmentApi = {
  getAll: () => request('/departments'),
  create: (data) => request('/departments', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/departments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/departments/${id}`, { method: 'DELETE' }),
};

// ── Officers ─────────────────────────────────────
export const officerApi = {
  getAll: () => request('/officers'),
  getById: (id) => request(`/officers/${id}`),
  create: (data) => request('/officers', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/officers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/officers/${id}`, { method: 'DELETE' }),
};

// ── Training Programmes ───────────────────────────
export const programmeApi = {
  getAll: () => request('/programmes'),
  getById: (id) => request(`/programmes/${id}`),
  create: (data, departmentIds) => {
    const params = departmentIds?.length
      ? '?' + departmentIds.map((id) => `departmentIds=${id}`).join('&')
      : '';
    return request(`/programmes${params}`, { method: 'POST', body: JSON.stringify(data) });
  },
  update: (id, data, departmentIds) => {
    const params = departmentIds?.length
      ? '?' + departmentIds.map((did) => `departmentIds=${did}`).join('&')
      : '';
    return request(`/programmes/${id}${params}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  delete: (id) => request(`/programmes/${id}`, { method: 'DELETE' }),
};

// ── Nominations ───────────────────────────────────
export const nominationApi = {
  getAll: () => request('/nominations'),
  getByProgramme: (programmeId) => request(`/nominations/programme/${programmeId}`),
  getByOfficer: (officerId) => request(`/nominations/officer/${officerId}`),
  checkDuplicate: (officerId, programmeId) =>
    request(`/nominations/check-duplicate?officerId=${officerId}&programmeId=${programmeId}`),
  submit: (data) => request('/nominations', { method: 'POST', body: JSON.stringify(data) }),
  cancel: (id) => request(`/nominations/${id}`, { method: 'DELETE' }),
};
