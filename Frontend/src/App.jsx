import { useState } from 'react';
import './index.css';
import Dashboard from './pages/Dashboard';
import Departments from './pages/Departments';
import Officers from './pages/Officers';
import Programmes from './pages/Programmes';
import Nominations from './pages/Nominations';

const NAV = [
  { id: 'dashboard',   label: 'Dashboard',           icon: '📊', section: 'Overview' },
  { id: 'departments', label: 'Departments',          icon: '🏢', section: 'Management' },
  { id: 'officers',    label: 'Officers',             icon: '👤', section: 'Management' },
  { id: 'programmes',  label: 'Training Programmes',  icon: '📚', section: 'Management' },
  { id: 'nominations', label: 'Nominations',          icon: '📋', section: 'Nominations' },
];

const PAGE_TITLES = {
  dashboard:   'Dashboard',
  departments: 'Departments',
  officers:    'Officers',
  programmes:  'Training Programmes',
  nominations: 'Nominations',
};

export default function App() {
  const [page, setPage] = useState('dashboard');

  const sections = [...new Set(NAV.map((n) => n.section))];

  const renderPage = () => {
    switch (page) {
      case 'dashboard':   return <Dashboard />;
      case 'departments': return <Departments />;
      case 'officers':    return <Officers />;
      case 'programmes':  return <Programmes />;
      case 'nominations': return <Nominations />;
      default:            return <Dashboard />;
    }
  };

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">🏛️</div>
          <h2>Training<br />Management</h2>
          <span>Government System</span>
        </div>

        <nav className="sidebar-nav">
          {sections.map((section) => (
            <div key={section}>
              <div className="nav-section-label">{section}</div>
              {NAV.filter((n) => n.section === section).map((n) => (
                <button
                  key={n.id}
                  id={`nav-${n.id}`}
                  className={`nav-btn ${page === n.id ? 'active' : ''}`}
                  onClick={() => setPage(n.id)}
                >
                  <span className="nav-icon">{n.icon}</span>
                  {n.label}
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid var(--border)',
          fontSize: 11,
          color: 'var(--text-dim)',
          lineHeight: 1.6
        }}>
          <div style={{ fontWeight: 600, marginBottom: 2 }}>Task 1 — Duplicate Nominations</div>
          <div>Spring Boot + React</div>
        </div>
      </aside>

      {/* Main */}
      <div className="main-content">
        <header className="topbar">
          <div className="topbar-title">
            {NAV.find((n) => n.id === page)?.icon}&nbsp;{PAGE_TITLES[page]}
          </div>
          <span className="topbar-badge">🛡️ Duplicate Prevention Active</span>
        </header>

        <main>{renderPage()}</main>
      </div>
    </div>
  );
}
