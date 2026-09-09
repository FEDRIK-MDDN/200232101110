import { useState, useEffect } from 'react';
import { nominationApi, officerApi, programmeApi, departmentApi, eligibilityApi } from '../api';

// Safely parse a nominatedAt value that may be an ISO string or a Java LocalDateTime array
const parseNominatedAt = (val) => {
  if (!val) return null;
  if (Array.isArray(val)) {
    // Java array: [year, month, day, hour, minute, second, nano?]
    const [y, mo, d, h = 0, mi = 0, s = 0] = val;
    return new Date(y, mo - 1, d, h, mi, s);
  }
  return new Date(val);
};

export default function Nominations() {
  const [nominations, setNominations] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [programmes, setProgrammes] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [alert, setAlert] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filterProg, setFilterProg] = useState('');
  const [filterDept, setFilterDept] = useState('');

  // Duplicate check state
  const [dupCheck, setDupCheck] = useState(null); // null | { isDuplicate, checking }

  // Task 3: Eligibility check state
  const [eligCheck, setEligCheck] = useState(null); // null | { checking, eligible, violations[] }

  const [form, setForm] = useState({
    officerId: '', trainingProgrammeId: '', nominatingDepartmentId: ''
  });

  const load = async () => {
    try {
      setLoading(true);
      const [n, o, p, d] = await Promise.all([
        nominationApi.getAll(),
        officerApi.getAll(),
        programmeApi.getAll(),
        departmentApi.getAll(),
      ]);
      setNominations(n || []);
      setOfficers(o || []);
      setProgrammes(p || []);
      setDepartments(d || []);
    } catch (e) {
      showAlert('danger', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Auto duplicate check whenever officer + programme are both selected
  useEffect(() => {
    if (form.officerId && form.trainingProgrammeId) {
      setDupCheck({ checking: true });
      nominationApi.checkDuplicate(form.officerId, form.trainingProgrammeId)
        .then((data) => setDupCheck({ checking: false, isDuplicate: data.isDuplicate }))
        .catch(() => setDupCheck(null));
    } else {
      setDupCheck(null);
    }
  }, [form.officerId, form.trainingProgrammeId]);

  // Task 3: Auto eligibility check whenever officer + programme are both selected
  useEffect(() => {
    if (form.officerId && form.trainingProgrammeId) {
      setEligCheck({ checking: true });
      eligibilityApi.check(form.officerId, form.trainingProgrammeId)
        .then((data) => setEligCheck({ checking: false, eligible: data.eligible, violations: data.violations }))
        .catch(() => setEligCheck(null));
    } else {
      setEligCheck(null);
    }
  }, [form.officerId, form.trainingProgrammeId]);

  const showAlert = (type, msg) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 5000);
  };

  const openModal = () => {
    setForm({ officerId: '', trainingProgrammeId: '', nominatingDepartmentId: '' });
    setDupCheck(null);
    setEligCheck(null);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.officerId || !form.trainingProgrammeId || !form.nominatingDepartmentId) return;
    if (dupCheck?.isDuplicate) return;
    if (eligCheck && !eligCheck.eligible) return;
    setSaving(true);
    try {
      const result = await nominationApi.submit({
        officerId: Number(form.officerId),
        trainingProgrammeId: Number(form.trainingProgrammeId),
        nominatingDepartmentId: Number(form.nominatingDepartmentId),
      });
      const statusMsg = result?.status === 'WAITLISTED'
        ? '📋 Programme is full — nomination placed on the waiting list.'
        : '✅ Nomination confirmed successfully!';
      showAlert('success', statusMsg);
      setShowModal(false);
      load();
    } catch (e) {
      showAlert('danger', e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async (id, status) => {
    const msg = status === 'CONFIRMED'
      ? 'Cancel this confirmed nomination? The first person on the waiting list will be automatically promoted.'
      : 'Remove this nomination from the waiting list?';
    if (!confirm(msg)) return;
    try {
      await nominationApi.cancel(id);
      showAlert('success',
        status === 'CONFIRMED'
          ? 'Nomination cancelled. Waiting list has been updated.'
          : 'Nomination removed from the waiting list.'
      );
      load();
    } catch (e) {
      showAlert('danger', e.message);
    }
  };

  const filtered = nominations.filter((n) => {
    const progMatch = !filterProg || String(n.trainingProgrammeId) === filterProg;
    const deptMatch = !filterDept || String(n.nominatingDepartmentId) === filterDept;
    return progMatch && deptMatch;
  });

  // Returns { confirmed, total, max } for a given programme id
  const getProgrammeSeatInfo = (progId) => {
    const prog = programmes.find((p) => p.id === progId);
    if (!prog) return null;
    const progNoms = nominations.filter((n) => n.trainingProgrammeId === progId);
    const confirmed = progNoms.filter((n) => n.status === 'CONFIRMED').length;
    const total = progNoms.length;
    return { confirmed, total, max: prog.maxParticipants };
  };

  // For modal: how many confirmed seats are taken for the selected programme
  const selectedProg = form.trainingProgrammeId
    ? programmes.find((p) => p.id === Number(form.trainingProgrammeId))
    : null;
  const selectedProgSeatInfo = selectedProg
    ? getProgrammeSeatInfo(selectedProg.id)
    : null;
  const willBeWaitlisted =
    selectedProgSeatInfo &&
    selectedProgSeatInfo.confirmed >= selectedProgSeatInfo.max;

  // Split filtered into confirmed and waitlisted for Task 2 presentation
  const filteredConfirmed = filtered.filter((n) => n.status === 'CONFIRMED');
  const filteredWaitlisted = filtered
    .filter((n) => n.status === 'WAITLISTED')
    .sort((a, b) => (a.waitlistPosition ?? 999) - (b.waitlistPosition ?? 999));

  // Shared nomination row renderer
  const renderRow = (n) => {
    const seatInfo = getProgrammeSeatInfo(n.trainingProgrammeId);
    const isFull = seatInfo && seatInfo.confirmed >= seatInfo.max;
    return (
      <tr key={n.nominationId}>
        <td><strong>{n.officerFullName}</strong></td>
        <td><span className="badge badge-blue">{n.officerEmployeeId}</span></td>
        <td>{n.trainingProgrammeTitle}</td>
        <td><span className="badge badge-blue">📅 {n.trainingDate}</span></td>
        <td><span className="badge badge-orange">🏢 {n.nominatingDepartmentName}</span></td>
        <td>
          {n.status === 'CONFIRMED' ? (
            <span className="badge badge-green">✅ Confirmed</span>
          ) : (
            <span className="badge badge-orange" title={`Waiting list position #${n.waitlistPosition}`}>
              📋 #{n.waitlistPosition}
            </span>
          )}
        </td>
        <td>
          {seatInfo && (
            <span className={`badge ${isFull ? 'badge-red' : 'badge-green'}`}>
              {seatInfo.confirmed}/{seatInfo.max}
            </span>
          )}
        </td>
        <td>
          <span className="text-muted text-sm">
            {parseNominatedAt(n.nominatedAt)
              ? parseNominatedAt(n.nominatedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
              : '—'}
          </span>
        </td>
        <td>
          <button
            className="btn btn-danger btn-sm"
            onClick={() => handleCancel(n.nominationId, n.status)}
          >
            Cancel
          </button>
        </td>
      </tr>
    );
  };

  return (
    <div className="page fade-in">
      {alert && (
        <div className={`alert alert-${alert.type}`}>
          {alert.type === 'success' ? '✅' : '❌'} {alert.msg}
        </div>
      )}

      {/* ── Task 2 Stats Summary Bar ── */}
      {!loading && nominations.length > 0 && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{
            flex: 1, minWidth: 140, background: 'rgba(16,185,129,0.1)',
            border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10,
            padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10
          }}>
            <span style={{ fontSize: 26 }}>✅</span>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--success)' }}>
                {nominations.filter((n) => n.status === 'CONFIRMED').length}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>CONFIRMED</div>
            </div>
          </div>
          <div style={{
            flex: 1, minWidth: 140, background: 'rgba(245,158,11,0.1)',
            border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10,
            padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10
          }}>
            <span style={{ fontSize: 26 }}>📋</span>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--warning)' }}>
                {nominations.filter((n) => n.status === 'WAITLISTED').length}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>WAITLISTED</div>
            </div>
          </div>
          <div style={{
            flex: 1, minWidth: 140, background: 'rgba(79,70,229,0.1)',
            border: '1px solid rgba(79,70,229,0.3)', borderRadius: 10,
            padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10
          }}>
            <span style={{ fontSize: 26 }}>📚</span>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--primary-light)' }}>
                {nominations.length}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL</div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <h2 className="card-title">📋 Nominations</h2>
          <div className="flex gap-3" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Department filter */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                🏢 Department
              </label>
              <select
                id="filter-department"
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                style={{ minWidth: 200 }}
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            {/* Programme filter */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                📚 Training Programme
              </label>
              <select
                id="filter-programme"
                value={filterProg}
                onChange={(e) => setFilterProg(e.target.value)}
                style={{ minWidth: 220 }}
              >
                <option value="">All Programmes</option>
                {programmes.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>

            {/* Clear filters button — only show when a filter is active */}
            {(filterDept || filterProg) && (
              <button
                className="btn btn-ghost btn-sm"
                style={{ alignSelf: 'flex-end', marginBottom: 2 }}
                onClick={() => { setFilterDept(''); setFilterProg(''); }}
              >
                ✕ Clear Filters
              </button>
            )}

            <button
              className="btn btn-success"
              style={{ alignSelf: 'flex-end', marginBottom: 2 }}
              onClick={openModal}
            >
              ＋ Submit Nomination
            </button>
          </div>
        </div>

        {loading ? (
          <div className="spinner" />
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <p>No nominations found.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* ✅ Confirmed Nominations */}
            {filteredConfirmed.length > 0 && (
              <div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  marginBottom: 10, padding: '6px 10px',
                  background: 'rgba(16,185,129,0.08)',
                  border: '1px solid rgba(16,185,129,0.25)',
                  borderRadius: 8
                }}>
                  <span style={{ fontSize: 16 }}>✅</span>
                  <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--success)' }}>
                    Confirmed Participants
                  </span>
                  <span className="badge badge-green" style={{ marginLeft: 'auto' }}>
                    {filteredConfirmed.length} confirmed
                  </span>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Officer</th>
                        <th>Employee ID</th>
                        <th>Programme</th>
                        <th>Training Date</th>
                        <th>Nominating Dept</th>
                        <th>Status</th>
                        <th>Seats Used</th>
                        <th>Nominated At</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>{filteredConfirmed.map(renderRow)}</tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 📋 Waiting List */}
            {filteredWaitlisted.length > 0 && (
              <div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  marginBottom: 10, padding: '6px 10px',
                  background: 'rgba(245,158,11,0.08)',
                  border: '1px solid rgba(245,158,11,0.25)',
                  borderRadius: 8
                }}>
                  <span style={{ fontSize: 16 }}>📋</span>
                  <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--warning)' }}>
                    Waiting List
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 4 }}>
                    — ordered by submission time (first in, first out)
                  </span>
                  <span className="badge badge-orange" style={{ marginLeft: 'auto' }}>
                    {filteredWaitlisted.length} waiting
                  </span>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Officer</th>
                        <th>Employee ID</th>
                        <th>Programme</th>
                        <th>Training Date</th>
                        <th>Nominating Dept</th>
                        <th>Status</th>
                        <th>Seats Used</th>
                        <th>Nominated At</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredWaitlisted.map((n) => {
                        const seatInfo = getProgrammeSeatInfo(n.trainingProgrammeId);
                        return (
                          <tr key={n.nominationId}>
                            <td>
                              <span style={{
                                fontWeight: 800, fontSize: 16,
                                color: n.waitlistPosition === 1 ? 'var(--warning)' : 'var(--text-muted)'
                              }}>
                                #{n.waitlistPosition}
                              </span>
                            </td>
                            <td><strong>{n.officerFullName}</strong></td>
                            <td><span className="badge badge-blue">{n.officerEmployeeId}</span></td>
                            <td>{n.trainingProgrammeTitle}</td>
                            <td><span className="badge badge-blue">📅 {n.trainingDate}</span></td>
                            <td><span className="badge badge-orange">🏢 {n.nominatingDepartmentName}</span></td>
                            <td>
                              <span className="badge badge-orange">
                                📋 Waitlisted #{n.waitlistPosition}
                              </span>
                              {n.waitlistPosition === 1 && (
                                <span style={{ marginLeft: 4, fontSize: 10, color: 'var(--warning)', fontWeight: 600 }}>
                                  ⬆️ Next up
                                </span>
                              )}
                            </td>
                            <td>
                              {seatInfo && (
                                <span className="badge badge-red">
                                  FULL {seatInfo.confirmed}/{seatInfo.max}
                                </span>
                              )}
                            </td>
                            <td>
                              <span className="text-muted text-sm">
                                {parseNominatedAt(n.nominatedAt)
                                  ? parseNominatedAt(n.nominatedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
                                  : '—'}
                              </span>
                            </td>
                            <td>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleCancel(n.nominationId, n.status)}
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">📋 Submit Nomination</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div className="form-grid mb-4">
              <div className="form-group full-width">
                <label>Training Programme *</label>
                <select
                  id="nom-programme"
                  value={form.trainingProgrammeId}
                  onChange={(e) => setForm({ ...form, trainingProgrammeId: e.target.value })}
                >
                  <option value="">— Select Programme —</option>
                  {programmes.map((p) => (
                    <option key={p.id} value={p.id}>{p.title} ({p.trainingDate})</option>
                  ))}
                </select>
              </div>

              <div className="form-group full-width">
                <label>Officer *</label>
                <select
                  id="nom-officer"
                  value={form.officerId}
                  onChange={(e) => setForm({ ...form, officerId: e.target.value })}
                >
                  <option value="">— Select Officer —</option>
                  {officers.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.fullName} ({o.employeeId}){o.department ? ` — ${o.department.name}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group full-width">
                <label>Nominating Department *</label>
                <select
                  id="nom-department"
                  value={form.nominatingDepartmentId}
                  onChange={(e) => setForm({ ...form, nominatingDepartmentId: e.target.value })}
                >
                  <option value="">— Select Department —</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Capacity / waitlist info banner */}
            {selectedProg && selectedProgSeatInfo && !dupCheck?.isDuplicate && (
              willBeWaitlisted ? (
                <div className="alert alert-info" style={{ marginBottom: 12 }}>
                  📋 <strong>{selectedProg.title}</strong> is at full capacity ({selectedProgSeatInfo.confirmed}/{selectedProgSeatInfo.max} confirmed).
                  This nomination will be placed on the <strong>waiting list</strong> and automatically confirmed if a seat becomes available.
                </div>
              ) : (
                <div className="alert alert-success" style={{ marginBottom: 12 }}>
                  🪑 <strong>{selectedProgSeatInfo.confirmed}/{selectedProgSeatInfo.max}</strong> seats confirmed —
                  this nomination will be <strong>confirmed immediately</strong>.
                </div>
              )
            )}

            {/* Duplicate Check Result */}
            {dupCheck?.checking && (
              <div className="alert alert-info">🔍 Checking for duplicates…</div>
            )}
            {dupCheck && !dupCheck.checking && dupCheck.isDuplicate && (
              <div className="duplicate-warning">
                <div className="dup-icon">⛔</div>
                <h3>Duplicate Nomination Detected!</h3>
                <p>
                  This officer is already nominated for the selected training programme
                  by another department. Submission is not allowed.
                </p>
              </div>
            )}
            {dupCheck && !dupCheck.checking && !dupCheck.isDuplicate && form.officerId && form.trainingProgrammeId && (
              <div className="alert alert-success">
                ✅ No duplicate found — this officer can be nominated.
              </div>
            )}

            {/* Task 3: Eligibility Check Results */}
            {eligCheck?.checking && (
              <div className="alert alert-info">🔍 Checking eligibility rules…</div>
            )}
            {eligCheck && !eligCheck.checking && !eligCheck.eligible && (
              <div style={{
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.4)',
                borderRadius: 10, padding: 16, marginBottom: 12
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 22 }}>⛔</span>
                  <span style={{ fontWeight: 700, color: '#f87171', fontSize: 15 }}>
                    Eligibility Requirements Not Met
                  </span>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {eligCheck.violations.map((v, i) => (
                    <li key={i} style={{
                      background: 'rgba(239,68,68,0.06)', borderRadius: 6,
                      padding: '6px 10px', fontSize: 13, color: '#fca5a5',
                      borderLeft: '3px solid rgba(239,68,68,0.5)'
                    }}>
                      ⚠️ {v}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {eligCheck && !eligCheck.checking && eligCheck.eligible && form.officerId && form.trainingProgrammeId && (
              <div className="alert alert-success">
                ✅ Officer meets all eligibility requirements for this programme.
              </div>
            )}

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button
                id="nom-submit-btn"
                className="btn btn-success"
                onClick={handleSubmit}
                disabled={
                  saving ||
                  !form.officerId ||
                  !form.trainingProgrammeId ||
                  !form.nominatingDepartmentId ||
                  dupCheck?.isDuplicate ||
                  dupCheck?.checking ||
                  eligCheck?.checking ||
                  (eligCheck && !eligCheck.eligible)
                }
              >
                {saving ? 'Submitting…' : willBeWaitlisted ? '📋 Add to Waiting List' : '✅ Confirm Nomination'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
