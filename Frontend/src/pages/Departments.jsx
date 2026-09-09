import { useState, useEffect } from 'react';
import { departmentApi } from '../api';

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editDept, setEditDept] = useState(null);
  const [formName, setFormName] = useState('');
  const [alert, setAlert] = useState(null);
  const [saving, setSaving] = useState(false);

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

  const openCreate = () => { setEditDept(null); setFormName(''); setShowModal(true); };
  const openEdit = (d) => { setEditDept(d); setFormName(d.name); setShowModal(true); };

  const handleSave = async () => {
    if (!formName.trim()) return;
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
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editDept ? '✏️ Edit Department' : '➕ New Department'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="form-group">
              <label>Department Name</label>
              <input
                id="dept-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Finance Division"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving || !formName.trim()}>
                {saving ? 'Saving…' : editDept ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
