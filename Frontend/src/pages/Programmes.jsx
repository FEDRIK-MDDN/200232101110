import { useState, useEffect } from 'react';
import { programmeApi, departmentApi } from '../api';

export default function Programmes() {
  const [programmes, setProgrammes] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editProg, setEditProg] = useState(null);
  const [alert, setAlert] = useState(null);
  const [saving, setSaving] = useState(false);

  const defaultForm = {
    title: '', trainingDate: '', venue: '', trainerName: '', maxParticipants: '',
  };
  const [form, setForm] = useState(defaultForm);
  const [selectedDeptIds, setSelectedDeptIds] = useState([]);

  const load = async () => {
    try {
      setLoading(true);
      const [p, d] = await Promise.all([programmeApi.getAll(), departmentApi.getAll()]);
      setProgrammes(p || []);
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
    setEditProg(null);
    setForm(defaultForm);
    setSelectedDeptIds([]);
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditProg(p);
    setForm({
      title: p.title,
      trainingDate: p.trainingDate,
      venue: p.venue,
      trainerName: p.trainerName,
      maxParticipants: p.maxParticipants,
    });
    setSelectedDeptIds(p.targetDepartments?.map((d) => d.id) || []);
    setShowModal(true);
  };

  const toggleDept = (id) => {
    setSelectedDeptIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.trainingDate || !form.venue.trim()) return;
    setSaving(true);
    try {
      const payload = { ...form, maxParticipants: Number(form.maxParticipants) };
      if (editProg) {
        await programmeApi.update(editProg.id, payload, selectedDeptIds);
        showAlert('success', 'Programme updated successfully!');
      } else {
        await programmeApi.create(payload, selectedDeptIds);
        showAlert('success', 'Programme created successfully!');
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
    if (!confirm('Delete this training programme?')) return;
    try {
      await programmeApi.delete(id);
      showAlert('success', 'Programme deleted.');
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
          <h2 className="card-title">📚 Training Programmes</h2>
          <button className="btn btn-primary" onClick={openCreate}>
            ＋ New Programme
          </button>
        </div>

        {loading ? (
          <div className="spinner" />
        ) : programmes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <p>No training programmes yet.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Date</th>
                  <th>Venue</th>
                  <th>Trainer</th>
                  <th>Max</th>
                  <th>Target Depts</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {programmes.map((p) => (
                  <tr key={p.id}>
                    <td><strong>{p.title}</strong></td>
                    <td><span className="badge badge-blue">📅 {p.trainingDate}</span></td>
                    <td><span className="text-muted">📍 {p.venue}</span></td>
                    <td>{p.trainerName}</td>
                    <td>
                      <span className="badge badge-green">{p.maxParticipants} seats</span>
                    </td>
                    <td>
                      <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                        {p.targetDepartments?.length > 0
                          ? p.targetDepartments.map((d) => (
                              <span key={d.id} className="badge badge-orange">{d.name}</span>
                            ))
                          : <span className="text-muted">All</span>}
                      </div>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}>✏️</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)}>🗑</button>
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
          <div className="modal" style={{ maxWidth: 620 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editProg ? '✏️ Edit Programme' : '➕ New Training Programme'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div className="form-grid">
              <div className="form-group full-width">
                <label>Programme Title *</label>
                <input
                  id="prog-title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Leadership Development Programme"
                />
              </div>
              <div className="form-group">
                <label>Training Date *</label>
                <input
                  id="prog-date"
                  type="date"
                  value={form.trainingDate}
                  onChange={(e) => setForm({ ...form, trainingDate: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Venue *</label>
                <input
                  id="prog-venue"
                  value={form.venue}
                  onChange={(e) => setForm({ ...form, venue: e.target.value })}
                  placeholder="e.g. Main Conference Hall"
                />
              </div>
              <div className="form-group">
                <label>Trainer / Resource Person</label>
                <input
                  id="prog-trainer"
                  value={form.trainerName}
                  onChange={(e) => setForm({ ...form, trainerName: e.target.value })}
                  placeholder="e.g. Dr. K. Silva"
                />
              </div>
              <div className="form-group">
                <label>Max Participants</label>
                <input
                  id="prog-max"
                  type="number"
                  min="1"
                  value={form.maxParticipants}
                  onChange={(e) => setForm({ ...form, maxParticipants: e.target.value })}
                  placeholder="e.g. 50"
                />
              </div>

              {departments.length > 0 && (
                <div className="form-group full-width">
                  <label>Target Departments</label>
                  <div className="flex gap-2" style={{ flexWrap: 'wrap', marginTop: 6 }}>
                    {departments.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => toggleDept(d.id)}
                        className={`btn btn-sm ${selectedDeptIds.includes(d.id) ? 'btn-primary' : 'btn-ghost'}`}
                      >
                        {selectedDeptIds.includes(d.id) ? '✓ ' : ''}{d.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving || !form.title.trim() || !form.trainingDate || !form.venue.trim()}
              >
                {saving ? 'Saving…' : editProg ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
