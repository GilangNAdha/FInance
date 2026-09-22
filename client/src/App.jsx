import { NavLink, Routes, Route, useLocation } from 'react-router-dom';
import WaveBackground from './components/WaveBackground.jsx';
import Dock from './components/Dock.jsx';
import { ToastProvider } from './components/Toast.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Transactions from './pages/Transactions.jsx';
import Reports from './pages/Reports.jsx';
import Settings from './pages/Settings.jsx';
import Office from './pages/Office.jsx';
import OfficeLayout from './pages/OfficeLayout.jsx';
import DocEditor from './pages/DocEditor.jsx';
import SheetEditor from './pages/SheetEditor.jsx';
import PdfEditor from './pages/PdfEditor.jsx';
import MarkdownEditor from './pages/MarkdownEditor.jsx';
import NotFound from './pages/NotFound.jsx';
import './office.css';

export default function App() {
  const { pathname } = useLocation();

  return (
    <ToastProvider>
      <div className="shell">
        <WaveBackground />

        <header className="topbar">
          <NavLink to="/" className="brand">
            <span className="brand-mark">◈</span>
            <span className="brand-text">
              <strong>Finance</strong>
              <small>Dashboard Keuangan</small>
            </span>
          </NavLink>

          <div className="topbar-search" role="search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              placeholder="Cari di halaman transaksi…"
              onFocus={() => {
                if (pathname !== '/transactions') window.location.assign('/transactions');
              }}
              aria-label="Cari transaksi"
              readOnly={pathname === '/transactions' ? false : true}
            />
          </div>

          <NavLink to="/transactions" className="topbar-cta" aria-label="Tambah transaksi">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </NavLink>
        </header>

        <main className="page" key={pathname}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/office" element={<OfficeLayout />}>
              <Route index element={<Office />} />
              <Route path="doc" element={<DocEditor />} />
              <Route path="sheet" element={<SheetEditor />} />
              <Route path="pdf" element={<PdfEditor />} />
              <Route path="markdown" element={<MarkdownEditor />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>

        <Dock />
      </div>
    </ToastProvider>
  );
}
