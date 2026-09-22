import { useFinance } from '../hooks/useFinance.jsx';
import { money, formatLongDate } from '../format.js';
import { exportUrl } from '../api.js';
import { Download, Info, Wallet, FileXls, Check } from '../components/Icons.jsx';

const features = [
  'Catat pemasukan & pengeluaran tanpa batas',
  'Total profit otomatis (pemasukan − pengeluaran)',
  'Filter transaksi: jenis, tanggal, pencarian',
  'Export laporan ke Excel (.xlsx) 2 sheet',
  'Data tersimpan aman di server (JSON)',
  'Tampilan glassmorphism responsif',
];

export default function Settings() {
  const { stats, transactions } = useFinance();

  return (
    <div className="page-title-block">
      <div className="title-row">
        <div>
          <h1 className="page-title">Pengaturan</h1>
          <p className="muted">Informasi aplikasi &amp; data</p>
        </div>
      </div>

      <section className="settings-grid">
        <article className="glass settings-card">
          <div className="card-head">
            <div>
              <h3>Aplikasi</h3>
              <p className="muted">Finance — Dashboard Keuangan</p>
            </div>
            <span className="stat-icon blue">
              <Wallet size={16} />
            </span>
          </div>
          <dl className="info-list">
            <div>
              <dt>Versi</dt>
              <dd>1.0.0</dd>
            </div>
            <div>
              <dt>Tanggal hari ini</dt>
              <dd>{formatLongDate()}</dd>
            </div>
            <div>
              <dt>Mata uang</dt>
              <dd>Rupiah (IDR · Rp)</dd>
            </div>
            <div>
              <dt>Bahasa</dt>
              <dd>Indonesia (id-ID)</dd>
            </div>
          </dl>
        </article>

        <article className="glass settings-card">
          <div className="card-head">
            <div>
              <h3>Data</h3>
              <p className="muted">Ringkasan penyimpanan</p>
            </div>
            <span className="stat-icon green">
              <Info size={16} />
            </span>
          </div>
          <dl className="info-list">
            <div>
              <dt>Jumlah transaksi</dt>
              <dd>{stats.count} entri</dd>
            </div>
            <div>
              <dt>Total pemasukan</dt>
              <dd className="text-income">{money(stats.totalIncome)}</dd>
            </div>
            <div>
              <dt>Total pengeluaran</dt>
              <dd className="text-expense">{money(stats.totalExpense)}</dd>
            </div>
            <div>
              <dt>Total profit</dt>
              <dd className={stats.profit >= 0 ? 'text-income' : 'text-expense'}>{money(stats.profit)}</dd>
            </div>
          </dl>
          <p className="muted small-note">
            File: <code>data/transactions.json</code> — dibuat otomatis oleh server.
          </p>
        </article>

        <article className="glass settings-card">
          <div className="card-head">
            <div>
              <h3>Cadangan (Export)</h3>
              <p className="muted">Unduh seluruh data sebagai Excel</p>
            </div>
            <span className="stat-icon violet">
              <FileXls size={16} />
            </span>
          </div>
          <p className="muted" style={{ margin: '0 0 14px' }}>
            Laporan lengkap semua transaksi ({stats.count} data) tanpa filter periode.
          </p>
          <a href={exportUrl()} className="btn btn-primary btn-block">
            <Download size={16} /> Export Semua ke Excel
          </a>
        </article>

        <article className="glass settings-card">
          <div className="card-head">
            <div>
              <h3>Fitur</h3>
              <p className="muted">Yang bisa Anda lakukan</p>
            </div>
          </div>
          <ul className="feature-list">
            {features.map((f) => (
              <li key={f}>
                <span className="feature-check">
                  <Check size={13} />
                </span>
                {f}
              </li>
            ))}
          </ul>
        </article>
      </section>

      <footer className="page-footer">
        <p>
          Finance © 2026 · {transactions.length} transaksi tersimpan · production-ready build
        </p>
      </footer>
    </div>
  );
}
