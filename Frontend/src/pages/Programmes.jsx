import { useState, useEffect, Fragment } from 'react';
import { programmeApi, departmentApi, nominationApi, eligibilityApi } from '../api';

export default function Programmes() {
  const [programmes, setProgrammes] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [nominations, setNominations] = useState([]);
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

  // Task 3: Eligibility rules state
  const [rulesPanel, setRulesPanel] = useState(null); // programmeId whose rules are shown
  const [rules, setRules] = useState([]);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [ruleForm, setRuleForm] = useState({ ruleType: 'DEPARTMENT_RESTRICTION', ruleValue: '', description: '' });
  const [addingRule, setAddingRule] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const [p, d, n] = await Promise.all([programmeApi.getAll(), departmentApi.getAll(), nominationApi.getAll()]);
      setProgrammes(p || []);
      setDepartments(d || []);
      setNominations(n || []);
    } catch (e) {
      showAlert('danger', e.message);
    } finally {
      setLoading(false);
    }
  };

  // Calculate capacity info for a programme
  const getSeatInfo = (progId, maxParticipants) => {
    const progNoms = nominations.filter((n) => n.trainingProgrammeId === progId);
    const confirmed = progNoms.filter((n) => n.status === 'CONFIRMED').length;
    const waitlisted = progNoms.filter((n) => n.status === 'WAITLISTED').length;
    const pct = maxParticipants > 0 ? Math.min((confirmed / maxParticipants) * 100, 100) : 0;
    const isFull = confirmed >= maxParticipants;
    return { confirmed, waitlisted, pct, isFull };
  };

  useEffect(() => { load(); }, []);

  // Task 3: Load rules for a programme
  const openRulesPanel = async (progId) => {
    if (rulesPanel === progId) { setRulesPanel(null); return; }
    setRulesPanel(progId);
    setRulesLoading(true);
    try {
      const data = await eligibilityApi.getRules(progId);
      setRules(data || []);
    } catch (e) {
      showAlert('danger', 'Could not load eligibility rules.');
    } finally {
      setRulesLoading(false);
    }
  };

  const handleAddRule = async (progId) => {
    if (!ruleForm.ruleValue.trim() || !ruleForm.description.trim()) return;
    setAddingRule(true);
    try {
      const newRule = await eligibilityApi.addRule(progId, ruleForm);
      setRules((prev) => [...prev, newRule]);
      setRuleForm({ ruleType: 'DEPARTMENT_RESTRICTION', ruleValue: '', description: '' });
      showAlert('success', 'Eligibility rule added!');
    } catch (e) {
      showAlert('danger', e.message);
    } finally {
      setAddingRule(false);
    }
  };

  const handleDeleteRule = async (ruleId) => {
    if (!confirm('Delete this eligibility rule?')) return;
    try {
      await eligibilityApi.deleteRule(ruleId);
      setRules((prev) => prev.filter((r) => r.id !== ruleId));
      showAlert('success', 'Rule deleted.');
    } catch (e) {
      showAlert('danger', e.message);
    }
  };

  const RULE_TYPES = [
    { value: 'DEPARTMENT_RESTRICTION', label: '🏢 Department Restriction', hint: 'Enter comma-separated dept IDs, e.g. 1,3,7' },
    { value: 'GRADE_REQUIREMENT',      label: '🏅 Grade Requirement',      hint: 'Enter required grade, e.g. Grade 3' },
    { value: 'MIN_YEARS_OF_SERVICE',   label: '📅 Min Years of Service',   hint: 'Enter minimum years, e.g. 5' },
    { value: 'COOLDOWN_MONTHS',        label: '⏳ Cooldown (months)',         hint: 'Enter number of months, e.g. 12' },
  ];

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
                  <th>Capacity</th>
                  <th>Target Depts</th>
                  <th>Eligibility Rules</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {programmes.map((p) => {
                  return <Fragment key={p.id}>
                  <tr>
                    <td><strong>{p.title}</strong></td>
                    <td><span className="badge badge-blue">📅 {p.trainingDate}</span></td>
                    <td><span className="text-muted">📍 {p.venue}</span></td>
                    <td>{p.trainerName}</td>
                    <td>
                      {(() => {
                        const { confirmed, waitlisted, pct, isFull } = getSeatInfo(p.id, p.maxParticipants);
                        return (
                          <div style={{ minWidth: 160 }}>
                            {/* Progress bar */}
                            <div style={{
                              background: 'var(--bg)', borderRadius: 6, height: 8,
                              overflow: 'hidden', marginBottom: 6,
                              border: '1px solid var(--border)'
                            }}>
                              <div style={{
                                width: `${pct}%`, height: '100%', borderRadius: 6,
                                background: isFull
                                  ? 'linear-gradient(90deg, var(--danger), var(--danger-light))'
                                  : 'linear-gradient(90deg, var(--success), var(--success-light))',
                                transition: 'width 0.4s ease'
                              }} />
                            </div>
                            {/* Counts */}
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              <span className={`badge ${isFull ? 'badge-red' : 'badge-green'}`}>
                                ✅ {confirmed}/{p.maxParticipants}
                              </span>
                              {waitlisted > 0 && (
                                <span className="badge badge-orange">
                                  📋 {waitlisted} waiting
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })()}
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
                    <td>
                      <button
                        className={`btn btn-sm ${rulesPanel === p.id ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => openRulesPanel(p.id)}
                        title="Manage eligibility rules"
                      >
                        🛡️ Rules
                      </button>
                    </td>
                  </tr>
                  {/* Inline eligibility rules panel */}
                  {rulesPanel === p.id && (
                    <tr>
                      <td colSpan={8} style={{ padding: 0, background: 'rgba(79,70,229,0.04)' }}>
                        <div style={{
                          padding: '16px 20px',
                          borderTop: '1px solid rgba(79,70,229,0.2)',
                          borderBottom: '1px solid rgba(79,70,229,0.2)'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                            <span style={{ fontSize: 18 }}>🛡️</span>
                            <span style={{ fontWeight: 700, fontSize: 14 }}>Eligibility Rules — {p.title}</span>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 4 }}>
                              (Task 3: Officers must pass all rules to be nominated)
                            </span>
                          </div>

                          {rulesLoading ? (
                            <div className="spinner" style={{ margin: '10px auto', width: 24, height: 24 }} />
                          ) : (
                            <>
                              {/* Existing rules */}
                              {rules.length === 0 ? (
                                <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 14 }}>
                                  ℹ️ No eligibility rules configured. All officers can be nominated.
                                </div>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                                  {rules.map((r) => (
                                    <div key={r.id} style={{
                                      display: 'flex', alignItems: 'center', gap: 10,
                                      background: 'var(--bg)', borderRadius: 8,
                                      padding: '8px 12px', border: '1px solid var(--border)'
                                    }}>
                                      <span className="badge badge-blue" style={{ whiteSpace: 'nowrap' }}>
                                        {RULE_TYPES.find((t) => t.value === r.ruleType)?.label || r.ruleType}
                                      </span>
                                      <span style={{ fontSize: 13, flex: 1 }}>{r.description}</span>
                                      <span className="badge badge-orange" style={{ fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{r.ruleValue}</span>
                                      <button
                                        className="btn btn-danger btn-sm"
                                        onClick={() => handleDeleteRule(r.id)}
                                        style={{ padding: '4px 8px' }}
                                      >
                                        🗑
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Add new rule form */}
                              <div style={{
                                background: 'var(--bg-card2)', borderRadius: 10,
                                padding: '12px 14px', border: '1px solid var(--border)'
                              }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                  ➕ Add New Rule
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr auto', gap: 10, alignItems: 'end' }}>
                                  <div>
                                    <label style={{ fontSize: 11, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>Rule Type</label>
                                    <select
                                      value={ruleForm.ruleType}
                                      onChange={(e) => setRuleForm({ ...ruleForm, ruleType: e.target.value })}
                                    >
                                      {RULE_TYPES.map((t) => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label style={{ fontSize: 11, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>
                                      Value
                                      <span style={{ marginLeft: 4, fontSize: 10, color: 'var(--accent)', fontStyle: 'italic' }}>
                                        {RULE_TYPES.find((t) => t.value === ruleForm.ruleType)?.hint}
                                      </span>
                                    </label>
                                    <input
                                      value={ruleForm.ruleValue}
                                      onChange={(e) => setRuleForm({ ...ruleForm, ruleValue: e.target.value })}
                                      placeholder="Rule value"
                                    />
                                  </div>
                                  <div>
                                    <label style={{ fontSize: 11, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>Description (shown to users)</label>
                                    <input
                                      value={ruleForm.description}
                                      onChange={(e) => setRuleForm({ ...ruleForm, description: e.target.value })}
                                      placeholder="e.g. Finance, Budget or Planning officers only"
                                    />
                                  </div>
                                  <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => handleAddRule(p.id)}
                                    disabled={addingRule || !ruleForm.ruleValue.trim() || !ruleForm.description.trim()}
                                  >
                                    {addingRule ? '…' : 'Add'}
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                  </Fragment>;
                })}
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
