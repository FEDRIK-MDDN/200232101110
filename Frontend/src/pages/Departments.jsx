import { useState, useEffect, useRef } from 'react';
import { departmentApi } from '../api';

// Predefined government department suggestions
const PRESET_DEPARTMENTS = [
  'Administration Division',
  'Finance Division',
  'Human Resources Division',
  'Information Technology Division',
  'Legal Affairs Division',
  'Planning & Development Division',
  'Procurement Division',
  'Public Relations Division',
  'Audit & Accounts Division',
  'Training & Development Division',
  'Operations Division',
  'Research & Statistics Division',
  'Health & Safety Division',
  'Internal Affairs Division',
  'External Relations Division',
  'Education & Welfare Division',
  'Infrastructure Division',
  'Policy & Strategy Division',
  'Records & Archives Division',
  'Security Division',
];

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editDept, setEditDept] = useState(null);
  const [formName, setFormName] = useState('');
  const [alert, setAlert] = useState(null);
  const [saving, setSaving] = useState(false);

  // Validation
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const modalRef = useRef(null);

  const load = async () => {
    try {
      setLoading(true);
      const data = await departmentApi.getAll();
      setDepartments(data || []);
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

  const validate = (name) => {
    const errs = {};
    if (!name.trim()) {
      errs.name = 'Department name is required.';
    } else if (/\d/.test(name)) {
      errs.name = 'Department name cannot contain numbers.';
    } else if (name.trim().length < 2) {
      errs.name = 'Name must be at least 2 characters.';
    }
    return errs;
  };

  const triggerShake = () => {
    if (!modalRef.current) return;
    modalRef.current.classList.remove('form-shake');
    void modalRef.current.offsetWidth; // reflow
    modalRef.current.classList.add('form-shake');
    setTimeout(() => modalRef.current?.classList.remove('form-shake'), 400);
  };

  const openCreate = () => {
    setEditDept(null);
    setFormName('');
    setErrors({});
    setTouched({});
    setShowModal(true);
  };

  const openEdit = (d) => {
    setEditDept(d);
    setFormName(d.name);
    setErrors({});
    setTouched({});
    setShowModal(true);
  };

  const handleBlur = () => {
    setTouched({ name: true });
    setErrors(validate(formName));
  };

  const handleChange = (val) => {
    // Strip any digit characters immediately
    const sanitized = val.replace(/\d/g, '');
    setFormName(sanitized);
    if (touched.name) setErrors(validate(sanitized));
  };

  // Block digit key presses at the keyboard level
  const handleKeyDown = (e) => {
    if (/^\d$/.test(e.key)) {
      e.preventDefault();
    }
    if (e.key === 'Enter') handleSave();
  };

  const handleSave = async () => {
    setTouched({ name: true });
    const errs = validate(formName);
    setErrors(errs);
    if (Object.keys(errs).length > 0) { triggerShake(); return; }

    setSaving(true);
    try {
      if (editDept) {
        await departmentApi.update(editDept.id, { name: formName.trim() });
        showAlert('success', 'Department updated successfully!');
      } else {
        await departmentApi.create({ name: formName.trim() });
        showAlert('success', 'Department created successfully!');
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
    if (!confirm('Delete this department?')) return;
    try {
      await departmentApi.delete(id);
      showAlert('success', 'Department deleted.');
      load();
    } catch (e) {
      showAlert('danger', e.message);
    }
  };

  return (
    <div className="page fade-in">
      {alert && (
        <div className={`alert alert-${alert.type}`}>
          {alert.type === 'success' ? '✅' : '❌'} {alert.msg}
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">🏢 Departments</h2>
          <button className="btn btn-primary" onClick={openCreate}>
            ＋ Add Department
          </button>
        </div>

        {loading ? (
          <div className="spinner" />
        ) : departments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏢</div>
            <p>No departments yet. Add your first department.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Department Name</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((d, i) => (
                  <tr key={d.id}>
                    <td><span className="text-muted">{i + 1}</span></td>
                    <td>
                      <span className="badge badge-blue">🏢</span>&nbsp;
                      <strong>{d.name}</strong>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(d)}>✏️ Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(d.id)}>🗑 Delete</button>
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
              <h3 className="modal-title">{editDept ? '✏️ Edit Department' : '➕ New Department'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label>Quick Select (Preset Departments)</label>
              <select
                id="dept-preset"
                value={PRESET_DEPARTMENTS.includes(formName) ? formName : ''}
                onChange={(e) => {
                  const val = e.target.value;
                  handleChange(val);
                }}
              >
                <option value="">— Choose a preset or type below —</option>
                {PRESET_DEPARTMENTS.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Department Name *</label>
              <input
                id="dept-name"
                value={formName}
                onChange={(e) => handleChange(e.target.value)}
                onBlur={handleBlur}
                placeholder="e.g. Finance Division"
                autoFocus
                onKeyDown={handleKeyDown}
                className={errors.name ? 'input-error' : ''}
              />
              {errors.name && <span className="field-error">{errors.name}</span>}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : editDept ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
