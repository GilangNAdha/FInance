import { NavLink, useLocation } from 'react-router-dom';
import { Home, List, Chart, Gear, Doc } from './Icons.jsx';

const items = [
  { to: '/', label: 'Beranda', icon: Home, end: true },
  { to: '/transactions', label: 'Transaksi', icon: List },
  { to: '/reports', label: 'Laporan', icon: Chart },
  { to: '/office', label: 'Office', icon: Doc },
  { to: '/settings', label: 'Atur', icon: Gear },
];

/** Dock navigasi mengambang di tengah bawah layar */
export default function Dock() {
  const { pathname } = useLocation();
  const officeActive = pathname.startsWith('/office');
  return (
    <nav className="dock" aria-label="Navigasi utama">
      <div className="dock-inner">
        {items.map(({ to, label, icon: Icon, end }) => {
          const active = to === '/office' ? officeActive : pathname === to && !officeActive;
          return (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={`dock-item${active ? ' active' : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              <span className="dock-icon">
                <Icon size={20} />
              </span>
              <span className="dock-label">{label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
