import { useState, useEffect } from 'react';
import { officerApi, programmeApi, nominationApi, departmentApi } from '../api';

export default function Dashboard() {
  const [stats, setStats] = useState({ officers: 0, programmes: 0, nominations: 0, departments: 0 });
  const [nominations, setNominations] = useState([]);
  const [programmes, setProgrammes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [o, p, n, d] = await Promise.all([
          officerApi.getAll(),
          programmeApi.getAll(),
          nominationApi.getAll(),
          departmentApi.getAll(),
        ]);
        setStats({
          officers: (o || []).length,
          programmes: (p || []).length,
          nominations: (n || []).length,
          departments: (d || []).length,
        });
        setNominations((n || []).slice(0, 6));
        setProgrammes((p || []).slice(0, 5));
      } catch (_) { /* backend may not be running */ }
      finally { setLoading(false); }
    }
    load();
  }, []);

  return (
    <div className="page fade-in">
      {/* Welcome Banner */}
      <div className="card mb-6" style={{
        background: 'linear-gradient(135deg, rgba(79,70,229,0.2), rgba(6,182,212,0.1))',
        border: '1px solid rgba(79,70,229,0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ fontSize: 48 }}>🏛️</div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
              Government Training Management System
            </h1>
            <p className="text-muted">
              Manage training programmes, officer nominations and prevent duplicate registrations.
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid mb-6">
        <div className="stat-card">
          <div className="stat-icon blue">👤</div>
          <div>
            <div className="stat-value">{loading ? '—' : stats.officers}</div>
            <div className="stat-label">Officers</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon cyan">📚</div>
          <div>
            <div className="stat-value">{loading ? '—' : stats.programmes}</div>
            <div className="stat-label">Programmes</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">📋</div>
          <div>
            <div className="stat-value">{loading ? '—' : stats.nominations}</div>
            <div className="stat-label">Nominations</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange">🏢</div>
          <div>
            <div className="stat-value">{loading ? '—' : stats.departments}</div>
            <div className="stat-label">Departments</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Recent Nominations */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">📋 Recent Nominations</h3>
          </div>
          {loading ? <div className="spinner" /> : nominations.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon" style={{ fontSize: 32 }}>📋</div>
              <p>No nominations yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {nominations.map((n) => (
                  <div key={n.nominationId} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', background: 'var(--bg)', borderRadius: 8,
                    border: '1px solid var(--border)'
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{n.officerFullName}</div>
                      <div className="text-muted" style={{ fontSize: 12 }}>{n.trainingProgrammeTitle}</div>
                    </div>
                    <span className={`badge ${n.status === 'CONFIRMED' ? 'badge-green' : 'badge-orange'}`}>
                      {n.status === 'CONFIRMED' ? '✅ Confirmed' : `📋 Waitlisted #${n.waitlistPosition}`}
                    </span>
                  </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Programmes */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">📚 Upcoming Programmes</h3>
          </div>
          {loading ? <div className="spinner" /> : programmes.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon" style={{ fontSize: 32 }}>📚</div>
              <p>No programmes yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {programmes.map((p) => (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', background: 'var(--bg)', borderRadius: 8,
                  border: '1px solid var(--border)'
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{p.title}</div>
                    <div className="text-muted" style={{ fontSize: 12 }}>📍 {p.venue}</div>
                  </div>
                  <span className="badge badge-blue">📅 {p.trainingDate}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* How Duplicate Prevention Works — Task 1 */}
      <div className="card mt-4" style={{
        background: 'rgba(16,185,129,0.05)',
        border: '1px solid rgba(16,185,129,0.2)'
      }}>
        <h3 className="card-title mb-4">🛡️ Task 1 — Duplicate Nomination Prevention</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            { icon: '🔍', title: 'Real-time Check', desc: 'System checks for duplicates instantly as you select an officer and programme.' },
            { icon: '⛔', title: 'Auto Block', desc: 'Submit button is disabled automatically if the officer is already nominated.' },
            { icon: '🗄️', title: 'DB Constraint', desc: 'A unique constraint at database level prevents duplicates even via direct API calls.' },
          ].map((item) => (
            <div key={item.title} style={{
              padding: '16px', background: 'var(--bg)', borderRadius: 10,
              border: '1px solid var(--border)'
            }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{item.title}</div>
              <p className="text-muted" style={{ fontSize: 12, lineHeight: 1.5 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Task 2 — Limited Training Capacity */}
      <div className="card mt-4" style={{
        background: 'rgba(6,182,212,0.05)',
        border: '1px solid rgba(6,182,212,0.2)'
      }}>
        <h3 className="card-title mb-4">📋 Task 2 — Limited Training Capacity &amp; Waiting List</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            {
              icon: '🦧',
              title: 'Capacity Enforcement',
              desc: 'When confirmed seats reach the programme maximum, new nominations are automatically placed on a waiting list instead of being rejected.',
              color: 'rgba(6,182,212,0.15)',
            },
            {
              icon: '📊',
              title: 'Ordered Waiting List',
              desc: 'Waitlisted nominees are ranked by the time their nomination was received (first come, first served). Each person sees their exact queue position.',
              color: 'rgba(245,158,11,0.15)',
            },
            {
              icon: '⬆️',
              title: 'Auto-Promotion',
              desc: 'If a confirmed participant cancels, the system automatically promotes the first person on the waiting list to confirmed status.',
              color: 'rgba(16,185,129,0.15)',
            },
          ].map((item) => (
            <div key={item.title} style={{
              padding: '16px', background: item.color, borderRadius: 10,
              border: '1px solid var(--border)'
            }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{item.title}</div>
              <p className="text-muted" style={{ fontSize: 12, lineHeight: 1.5 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
