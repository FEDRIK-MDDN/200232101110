import axios from 'axios';

// ── Axios instance ────────────────────────────────
const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' },
});

// Response interceptor — unwrap data or throw a readable error
api.interceptors.response.use(
  (res) => res.data.data,          // unwrap: { success, data } → data
  (err) => {
    const msg =
      err.response?.data?.message || // backend error message
      err.message ||                  // axios/network error
      'Request failed';
    return Promise.reject(new Error(msg));
  }
);

// ── Departments ──────────────────────────────────
export const departmentApi = {
  getAll:         ()         => api.get('/departments'),
  create:         (data)     => api.post('/departments', data),
  update:         (id, data) => api.put(`/departments/${id}`, data),
  delete:         (id)       => api.delete(`/departments/${id}`),
};

// ── Officers ─────────────────────────────────────
export const officerApi = {
  getAll:   ()         => api.get('/officers'),
  getById:  (id)       => api.get(`/officers/${id}`),
  create:   (data)     => api.post('/officers', data),
  update:   (id, data) => api.put(`/officers/${id}`, data),
  delete:   (id)       => api.delete(`/officers/${id}`),
};

// ── Training Programmes ───────────────────────────
export const programmeApi = {
  getAll:   ()         => api.get('/programmes'),
  getById:  (id)       => api.get(`/programmes/${id}`),
  create:   (data, departmentIds) => {
    const params = departmentIds?.length
      ? { params: new URLSearchParams(departmentIds.map((id) => ['departmentIds', id])) }
      : {};
    return api.post('/programmes', data, params);
  },
  update:   (id, data, departmentIds) => {
    const params = departmentIds?.length
      ? { params: new URLSearchParams(departmentIds.map((did) => ['departmentIds', did])) }
      : {};
    return api.put(`/programmes/${id}`, data, params);
  },
  delete:   (id)       => api.delete(`/programmes/${id}`),
};

// ── Nominations ───────────────────────────────────
export const nominationApi = {
  getAll:          ()                       => api.get('/nominations'),
  getByProgramme:  (programmeId)            => api.get(`/nominations/programme/${programmeId}`),
  getByOfficer:    (officerId)              => api.get(`/nominations/officer/${officerId}`),
  checkDuplicate:  (officerId, programmeId) =>
    api.get('/nominations/check-duplicate', { params: { officerId, programmeId } }),
  submit:          (data)                   => api.post('/nominations', data),
  cancel:          (id)                     => api.delete(`/nominations/${id}`),
};

// ── Eligibility (Task 3) ──────────────────────────
export const eligibilityApi = {
  check:        (officerId, programmeId) =>
    api.get('/eligibility/check', { params: { officerId, programmeId } }),
  getRules:     (programmeId)   => api.get(`/eligibility/rules/${programmeId}`),
  addRule:      (programmeId, data) => api.post(`/eligibility/rules/${programmeId}`, data),
  deleteRule:   (ruleId)        => api.delete(`/eligibility/rules/${ruleId}`),
};
