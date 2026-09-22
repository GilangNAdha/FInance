import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast.jsx';
import { Download, FileXls } from '../components/Icons.jsx';
import { exportUrl } from '../api.js';

const EXT_MAP = {
  docx: '/office/doc',
  doc: '/office/doc',
  html: '/office/doc',
  htm: '/office/doc',
  rtf: '/office/doc',
  txt: '/office/doc',
  md: '/office/markdown',
  markdown: '/office/markdown',
  xlsx: '/office/sheet',
  xls: '/office/sheet',
  csv: '/office/sheet',
  pdf: '/office/pdf',
};

const LAUNCHERS = [
  {
    key: 'word',
    cls: 'word',
    icon: 'W',
    title: 'Dokumen Word',
    desc: 'Editor teks kaya (DOCX/DOC/RTF/HTML). Buka, sunting, dan unduh sebagai .docx atau PDF.',
    meta: 'Word · DOC · HTML',
    to: '/office/doc',
  },
  {
    key: 'sheet',
    cls: 'sheet',
    icon: 'X',
    title: 'Lembar Excel',
    desc: 'Spreadsheet dengan formula (SUM, AVERAGE, dll). Impor/ekspor .xlsx, .xls, .csv.',
    meta: 'Excel · XLS · CSV',
    to: '/office/sheet',
  },
  {
    key: 'pdf',
    cls: 'pdf',
    icon: 'P',
    title: 'Editor PDF',
    desc: 'Pratinjau, gabungkan, dan rotasi halaman PDF — langsung di browser tanpa upload.',
    meta: 'PDF tools',
    to: '/office/pdf',
  },
  {
    key: 'md',
    cls: 'md',
    icon: 'M',
    title: 'Markdown',
    desc: 'Tulis Markdown dengan pratinjau langsung, ekspor ke HTML dan .md.',
    meta: 'MD · HTML',
    to: '/office/markdown',
  },
];

export default function Office() {
  const navigate = useNavigate();
  const showToast = useToast();
  const fileRef = useRef(null);
  const [drag, setDrag] = useState(false);

  function openFile(file) {
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    const route = EXT_MAP[ext];
    if (!route) {
      showToast(`Format .${ext} belum didukung. Coba DOCX, XLSX, PDF, CSV, atau MD.`, 'error');
      return;
    }
    // Simpan file sementara di sessionStorage untuk editor tujuan
    try {
      const holder = { name: file.name, type: file.type, lastModified: file.lastModified };
      sessionStorage.setItem('office-pending-file-meta', JSON.stringify(holder));
      // Simpan sebagai data URL agar lintas halaman
      const reader = new FileReader();
      reader.onload = () => {
        sessionStorage.setItem('office-pending-file', String(reader.result));
        navigate(route);
      };
      reader.onerror = () => showToast('Gagal membaca file.', 'error');
      reader.readAsDataURL(file);
    } catch (err) {
      // quota — tetap navigasi tanpa file
      console.warn(err);
      navigate(route);
    }
  }

  function onDrop(e) {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files?.[0];
    if (f) openFile(f);
  }

  return (
    <div className="office-shell">
      {/* Hero */}
      <section className="glass office-hero">
        <p className="hero-kicker">Office Suite</p>
        <h1 className="page-title">
          Editor Dokumen, Spreadsheet &amp; PDF <span className="wave-hand">📄</span>
        </h1>
        <p className="muted" style={{ maxWidth: 640, marginTop: 6 }}>
          Buka dan sunting file Word/DOC, Excel, PDF, dan Markdown langsung di browser —
          terinspirasi dari GenOffice &amp; Microsoft 365. Semua diproses lokal, tanpa upload ke server.
        </p>
        <div className="quick-row" style={{ marginTop: 16 }}>
          <button type="button" className="btn btn-primary" onClick={() => navigate('/office/doc')}>
            ➕ Dokumen Baru
          </button>
          <button type="button" className="btn btn-glass" onClick={() => navigate('/office/sheet')}>
            ➕ Spreadsheet Baru
          </button>
          <a href={exportUrl()} className="btn btn-glass">
            <Download size={15} /> Laporan Keuangan (.xlsx)
          </a>
          <button
            type="button"
            className="btn btn-glass"
            onClick={() => showToast('Pilih file lewat dropzone atau kartu editor di bawah')}
          >
            <FileXls size={15} /> Buka File
          </button>
        </div>
      </section>

      {/* Launcher cards */}
      <div className="office-section-title">
        <h2>Aplikasi</h2>
        <p>Pilih editor atau jatuhkan file ke dropzone</p>
      </div>
      <section className="launcher-grid">
        {LAUNCHERS.map((l) => (
          <button key={l.key} type="button" className="launch-card" onClick={() => navigate(l.to)}>
            <span className={`launch-icon ${l.cls}`}>{l.icon}</span>
            <h3>{l.title}</h3>
            <p>{l.desc}</p>
            <span className="launch-meta">{l.meta} →</span>
          </button>
        ))}
      </section>

      {/* Dropzone */}
      <div
        className={`dropzone${drag ? ' dragover' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
      >
        <div className="dropzone-icon">📂</div>
        <strong>Jatuhkan file ke sini atau klik untuk memilih</strong>
        <span>DOCX · DOC · XLSX · XLS · CSV · PDF · HTML · TXT · MD</span>
        <input
          ref={fileRef}
          type="file"
          className="tb-fileinput"
          accept=".doc,.docx,.rtf,.html,.htm,.txt,.md,.markdown,.xlsx,.xls,.csv,.pdf"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) openFile(f);
            e.target.value = '';
          }}
        />
      </div>

      {/* Eksternal */}
      <div className="office-section-title">
        <h2>Eksternal</h2>
        <p>Suite populer yang menginspirasi halaman ini</p>
      </div>
      <section className="ext-grid">
        <article className="glass ext-card">
          <span className="ext-badge go">Gen<br />Office</span>
          <div>
            <h4>GenOffice (open-source)</h4>
            <p>
              Suite AI Office gratis: Docs, Sheets, Slides, PDF — edit file .docx/.xlsx/.pptx
              asli secara lokal. Apache-2.0.
            </p>
            <a
              className="ext-link"
              href="https://github.com/genspark-ai/genoffice"
              target="_blank"
              rel="noreferrer"
            >
              Lihat di GitHub →
            </a>
          </div>
        </article>
        <article className="glass ext-card">
          <span className="ext-badge ms">MS<br />365</span>
          <div>
            <h4>Microsoft 365 Web</h4>
            <p>
              Buka Word, Excel, PowerPoint versi web gratis (akun Microsoft) — pola yang
              dipakai MS-365-Electron.
            </p>
            <a
              className="ext-link"
              href="https://www.office.com"
              target="_blank"
              rel="noreferrer"
            >
              Buka office.com →
            </a>
            <span style={{ margin: '0 8px', color: 'var(--muted-2, #94a3b8)' }}>·</span>
            <a
              className="ext-link"
              href="https://github.com/agam778/MS-365-Electron"
              target="_blank"
              rel="noreferrer"
            >
              MS-365-Electron →
            </a>
          </div>
        </article>
      </section>
    </div>
  );
}
