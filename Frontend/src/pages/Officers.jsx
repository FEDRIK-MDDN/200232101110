import { useState, useEffect, useRef } from 'react';
import { officerApi, departmentApi } from '../api';

export default function Officers() {
  const [officers, setOfficers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editOfficer, setEditOfficer] = useState(null);
  const [alert, setAlert] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const [form, setForm] = useState({
    employeeId: '', fullName: '', email: '', department: { id: '' }
  });

  // Validation
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const modalRef = useRef(null);

  const load = async () => {
    try {
      setLoading(true);
      const [o, d] = await Promise.all([officerApi.getAll(), departmentApi.getAll()]);
      setOfficers(o || []);
      setDepartments(d || []);
    } catch (e) {
      showAlert('danger', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const showAlert = (type, msg) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 4000);
  };

  // ----- Validation -----
  const validate = (f) => {
    const errs = {};
    if (!f.employeeId.trim()) {
      errs.employeeId = 'Employee ID is required.';
    } else if (f.employeeId.trim().length < 2) {
      errs.employeeId = 'Employee ID must be at least 2 characters.';
    }
    if (!f.fullName.trim()) {
      errs.fullName = 'Full name is required.';
    } else if (f.fullName.trim().length < 2) {
      errs.fullName = 'Full name must be at least 2 characters.';
    }
    if (f.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) {
      errs.email = 'Please enter a valid email address.';
    }
    return errs;
  };

  const triggerShake = () => {
    if (!modalRef.current) return;
    modalRef.current.classList.remove('form-shake');
    void modalRef.current.offsetWidth;
    modalRef.current.classList.add('form-shake');
    setTimeout(() => modalRef.current?.classList.remove('form-shake'), 400);
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors(validate(form));
  };

  const handleChange = (field, value) => {
    const updated = { ...form, [field]: value };
    setForm(updated);
    if (touched[field]) setErrors(validate(updated));
  };
  // ----------------------

  const openCreate = () => {
    setEditOfficer(null);
    setForm({ employeeId: '', fullName: '', email: '', department: { id: '' } });
    setErrors({});
    setTouched({});
    setShowModal(true);
  };

  const openEdit = (o) => {
    setEditOfficer(o);
    setForm({
      employeeId: o.employeeId,
      fullName: o.fullName,
      email: o.email || '',
      department: { id: o.department?.id || '' }
    });
    setErrors({});
    setTouched({});
    setShowModal(true);
  };

  const handleSave = async () => {
    const allTouched = { employeeId: true, fullName: true, email: true };
    setTouched(allTouched);
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) { triggerShake(); return; }

    setSaving(true);
    try {
      const payload = {
        ...form,
        department: form.department.id ? { id: Number(form.department.id) } : null
      };
      if (editOfficer) {
        await officerApi.update(editOfficer.id, payload);
        showAlert('success', 'Officer updated successfully!');
      } else {
        await officerApi.create(payload);
        showAlert('success', 'Officer created successfully!');
      }
      setShowModal(false);
      load();
    } catch (e) {
      showAlert('danger', e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this officer?')) return;
    try {
      await officerApi.delete(id);
      showAlert('success', 'Officer deleted.');
      load();
    } catch (e) {
      showAlert('danger', e.message);
    }
  };

  const filtered = officers.filter(
    (o) =>
      o.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      o.employeeId?.toLowerCase().includes(search.toLowerCase()) ||
      o.department?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page fade-in">
      {alert && (
        <div className={`alert alert-${alert.type}`}>
          {alert.type === 'success' ? '✅' : '❌'} {alert.msg}
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">👤 Officers</h2>
          <div className="flex gap-3">
            <input
              placeholder="🔍 Search officers…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 220 }}
            />
            <button className="btn btn-primary" onClick={openCreate}>
              ＋ Add Officer
            </button>
          </div>
        </div>

        {loading ? (
          <div className="spinner" />
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👤</div>
            <p>{search ? 'No officers match your search.' : 'No officers yet.'}</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Full Name</th>
                  <th>Department</th>
                  <th>Email</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr key={o.id}>
                    <td><span className="badge badge-blue">{o.employeeId}</span></td>
                    <td><strong>{o.fullName}</strong></td>
                    <td>
                      {o.department
                        ? <span className="badge badge-orange">🏢 {o.department.name}</span>
                        : <span className="text-muted">—</span>}
                    </td>
                    <td><span className="text-muted">{o.email || '—'}</span></td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(o)}>✏️ Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(o.id)}>🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" ref={modalRef} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editOfficer ? '✏️ Edit Officer' : '➕ New Officer'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label>Employee ID *</label>
                <input
                  id="officer-empid"
                  value={form.employeeId}
                  onChange={(e) => handleChange('employeeId', e.target.value)}
                  onBlur={() => handleBlur('employeeId')}
                  placeholder="e.g. EMP-001"
                  className={errors.employeeId ? 'input-error' : ''}
                />
                {errors.employeeId && <span className="field-error">{errors.employeeId}</span>}
              </div>
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  id="officer-name"
                  value={form.fullName}
                  onChange={(e) => handleChange('fullName', e.target.value)}
                  onBlur={() => handleBlur('fullName')}
                  placeholder="e.g. A. Perera"
                  className={errors.fullName ? 'input-error' : ''}
                />
                {errors.fullName && <span className="field-error">{errors.fullName}</span>}
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  id="officer-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                  placeholder="officer@gov.lk"
                  className={errors.email ? 'input-error' : ''}
                />
                {errors.email && <span className="field-error">{errors.email}</span>}
              </div>
              <div className="form-group">
                <label>Department</label>
                <select
                  id="officer-dept"
                  value={form.department.id}
                  onChange={(e) => setForm({ ...form, department: { id: e.target.value } })}
                >
                  <option value="">— Select Department —</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving…' : editOfficer ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Officers() {
  const [officers, setOfficers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editOfficer, setEditOfficer] = useState(null);
  const [alert, setAlert] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const [form, setForm] = useState({
    employeeId: '', fullName: '', email: '', department: { id: '' }
  });

  const load = async () => {
    try {
      setLoading(true);
      const [o, d] = await Promise.all([officerApi.getAll(), departmentApi.getAll()]);
      setOfficers(o || []);
      setDepartments(d || []);
    } catch (e) {
      showAlert('danger', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const showAlert = (type, msg) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 4000);
  };

  const openCreate = () => {
    setEditOfficer(null);
    setForm({ employeeId: '', fullName: '', email: '', department: { id: '' } });
    setShowModal(true);
  };

  const openEdit = (o) => {
    setEditOfficer(o);
    setForm({
      employeeId: o.employeeId,
      fullName: o.fullName,
      email: o.email || '',
      department: { id: o.department?.id || '' }
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.fullName.trim() || !form.employeeId.trim()) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        department: form.department.id ? { id: Number(form.department.id) } : null
      };
      if (editOfficer) {
        await officerApi.update(editOfficer.id, payload);
        showAlert('success', 'Officer updated successfully!');
      } else {
        await officerApi.create(payload);
        showAlert('success', 'Officer created successfully!');
      }
      setShowModal(false);
      load();
    } catch (e) {
      showAlert('danger', e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this officer?')) return;
    try {
      await officerApi.delete(id);
      showAlert('success', 'Officer deleted.');
      load();
    } catch (e) {
      showAlert('danger', e.message);
    }
  };

  const filtered = officers.filter(
    (o) =>
      o.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      o.employeeId?.toLowerCase().includes(search.toLowerCase()) ||
      o.department?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page fade-in">
      {alert && (
        <div className={`alert alert-${alert.type}`}>
          {alert.type === 'success' ? '✅' : '❌'} {alert.msg}
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">👤 Officers</h2>
          <div className="flex gap-3">
            <input
              placeholder="🔍 Search officers…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 220 }}
            />
            <button className="btn btn-primary" onClick={openCreate}>
              ＋ Add Officer
            </button>
          </div>
        </div>

        {loading ? (
          <div className="spinner" />
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👤</div>
            <p>{search ? 'No officers match your search.' : 'No officers yet.'}</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Full Name</th>
                  <th>Department</th>
                  <th>Email</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr key={o.id}>
                    <td><span className="badge badge-blue">{o.employeeId}</span></td>
                    <td><strong>{o.fullName}</strong></td>
                    <td>
                      {o.department
                        ? <span className="badge badge-orange">🏢 {o.department.name}</span>
                        : <span className="text-muted">—</span>}
                    </td>
                    <td><span className="text-muted">{o.email || '—'}</span></td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(o)}>✏️ Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(o.id)}>🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editOfficer ? '✏️ Edit Officer' : '➕ New Officer'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label>Employee ID *</label>
                <input
                  id="officer-empid"
                  value={form.employeeId}
                  onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                  placeholder="e.g. EMP-001"
                />
              </div>
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  id="officer-name"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  placeholder="e.g. A. Perera"
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  id="officer-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="officer@gov.lk"
                />
              </div>
              <div className="form-group">
                <label>Department</label>
                <select
                  id="officer-dept"
                  value={form.department.id}
                  onChange={(e) => setForm({ ...form, department: { id: e.target.value } })}
                >
                  <option value="">— Select Department —</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving || !form.fullName.trim() || !form.employeeId.trim()}
              >
                {saving ? 'Saving…' : editOfficer ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
