import { useState, useEffect } from 'react';
import { nominationApi, officerApi, programmeApi, departmentApi } from '../api';

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

  const showAlert = (type, msg) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 5000);
  };

  const openModal = () => {
    setForm({ officerId: '', trainingProgrammeId: '', nominatingDepartmentId: '' });
    setDupCheck(null);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.officerId || !form.trainingProgrammeId || !form.nominatingDepartmentId) return;
    if (dupCheck?.isDuplicate) return;
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

  return (
    <div className="page fade-in">
      {alert && (
        <div className={`alert alert-${alert.type}`}>
          {alert.type === 'success' ? '✅' : '❌'} {alert.msg}
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
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Officer</th>
                  <th>Employee ID</th>
                  <th>Programme</th>
                  <th>Date</th>
                  <th>Nominating Dept</th>
                  <th>Status</th>
                  <th>Seats (Confirmed)</th>
                  <th>Nominated At</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((n) => {
                  const seatInfo = getProgrammeSeatInfo(n.trainingProgrammeId);
                  const isConfirmed = n.status === 'CONFIRMED';
                  const isFull = seatInfo && seatInfo.confirmed >= seatInfo.max;
                  return (
                    <tr key={n.nominationId}>
                      <td><strong>{n.officerFullName}</strong></td>
                      <td><span className="badge badge-blue">{n.officerEmployeeId}</span></td>
                      <td>{n.trainingProgrammeTitle}</td>
                      <td><span className="badge badge-blue">📅 {n.trainingDate}</span></td>
                      <td><span className="badge badge-orange">🏢 {n.nominatingDepartmentName}</span></td>
                      <td>
                        {isConfirmed ? (
                          <span className="badge badge-green">✅ Confirmed</span>
                        ) : (
                          <span className="badge badge-orange" title={`Waiting list position #${n.waitlistPosition}`}>
                            📋 Waitlisted #{n.waitlistPosition}
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
                          {new Date(n.nominatedAt).toLocaleDateString()}
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
                })}
              </tbody>
            </table>
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
                  dupCheck?.checking
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
