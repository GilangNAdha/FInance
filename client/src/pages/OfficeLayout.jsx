import { NavLink, Outlet, useLocation, Link } from 'react-router-dom';

const tabs = [
  { to: '/office', label: 'Beranda', icon: '🏠', end: true },
  { to: '/office/doc', label: 'Dokumen', icon: '📄' },
  { to: '/office/sheet', label: 'Spreadsheet', icon: '📊' },
  { to: '/office/pdf', label: 'PDF', icon: '📕' },
  { to: '/office/markdown', label: 'Markdown', icon: '✍️' },
];

/** Layout tab untuk semua halaman Office */
export default function OfficeLayout() {
  const { pathname } = useLocation();
  return (
    <div className="office-shell" key={pathname}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <Link to="/office" className="btn btn-glass btn-sm" title="Kembali ke hub Office">
          ← Office
        </Link>
        <nav className="office-tabs" aria-label="Navigasi Office">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) => `office-tab${isActive ? ' active' : ''}`}
            >
              <span aria-hidden="true">{t.icon}</span> {t.label}
            </NavLink>
          ))}
        </nav>
      </div>
      <Outlet />
    </div>
  );
}
