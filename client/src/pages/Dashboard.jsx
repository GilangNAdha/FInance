import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useFinance } from '../hooks/useFinance.jsx';
import { money, moneyShort, formatLongDate, formatDate, todayISO } from '../format.js';
import { exportUrl } from '../api.js';
import AreaChart from '../components/AreaChart.jsx';
import BarChart from '../components/BarChart.jsx';
import Donut from '../components/Donut.jsx';
import { ArrowUp, ArrowDown, Download, Plus, Wallet, Sparkle, Chart } from '../components/Icons.jsx';

/** Susun transaksi terakhir 12 minggu → bucket mingguan untuk grafik */
function weeklyBuckets(transactions) {
  const weeks = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const end = new Date(now);
    end.setDate(end.getDate() - i * 7);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    weeks.push({
      start: start.toISOString().slice(0, 10),
      end: end.toISOString().slice(0, 10),
      income: 0,
      expense: 0,
      label: `${start.getDate()}`,
    });
  }
  for (const t of transactions) {
    for (const w of weeks) {
      if (t.date >= w.start && t.date <= w.end) {
        if (t.type === 'income') w.income += t.amount;
        else w.expense += t.amount;
      }
    }
  }
  return weeks;
}

/** Pengeluaran per kategori (top 5) */
function expenseByCategory(transactions) {
  const map = new Map();
  for (const t of transactions) {
    if (t.type !== 'expense') continue;
    map.set(t.category || 'Lainnya', (map.get(t.category || 'Lainnya') || 0) + t.amount);
  }
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value]) => ({ name, value }));
}

const PALETTE = ['#2563eb', '#7c3aed', '#0891b2', '#db2777', '#d97706'];

export default function Dashboard() {
  const { transactions, stats, loading, statsFor } = useFinance();

  const weeks = useMemo(() => weeklyBuckets(transactions), [transactions]);
  const chartData = weeks.map((w) => w.income);
  const chartLabels = weeks.filter((_, i) => i % 3 === 0).map((w) => formatDate(w.start).slice(0, 6));

  const recent = useMemo(
    () =>
      [...transactions]
        .sort((a, b) => (a.date === b.date ? (b.createdAt || '').localeCompare(a.createdAt || '') : b.date.localeCompare(a.date)))
        .slice(0, 6),
    [transactions]
  );

  const expenseCats = useMemo(() => expenseByCategory(transactions), [transactions]);
  const totalExpenseCat = expenseCats.reduce((s, c) => s + c.value, 0);

  const today = new Date();
  const dayNum = today.getDate();
  const dayName = today.toLocaleDateString('id-ID', { weekday: 'short' });
  const monthName = today.toLocaleDateString('id-ID', { month: 'long' });

  // Minggu ini vs minggu lalu
  const trend = useMemo(() => {
    const now = new Date();
    const thisStart = new Date(now);
    thisStart.setDate(now.getDate() - 6);
    const prevEnd = new Date(thisStart);
    prevEnd.setDate(thisStart.getDate() - 1);
    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevEnd.getDate() - 6);
    const iso = (d) => d.toISOString().slice(0, 10);
    const cur = statsFor(transactions.filter((t) => t.date >= iso(thisStart) && t.date <= iso(now))).totalIncome;
    const prev = statsFor(transactions.filter((t) => t.date >= iso(prevStart) && t.date <= iso(prevEnd))).totalIncome;
    if (prev === 0) return { pct: cur > 0 ? 100 : 0, up: cur >= 0 };
    const pct = ((cur - prev) / prev) * 100;
    return { pct: Math.abs(pct).toFixed(1).replace('.', ','), up: pct >= 0 };
  }, [transactions, statsFor]);

  const recentStats = statsFor(recent);

  if (loading) {
    return (
      <div className="page-loading">
        <div className="pulse-card" />
        <div className="pulse-card" />
        <div className="pulse-card wide" />
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Hero sapaan */}
      <section className="hero glass">
        <div className="hero-copy">
          <p className="hero-kicker">Ringkasan hari ini</p>
          <h1>
            Halo, selamat datang! <span className="wave-hand">👋</span>
          </h1>
          <p className="hero-sub">Pantau pemasukan, pengeluaran, dan profit bisnismu dalam satu tempat.</p>
          <div className="hero-actions">
            <Link to="/transactions" className="btn btn-primary">
              <Plus size={16} /> Catat Transaksi
            </Link>
            <a href={exportUrl()} className="btn btn-glass">
              <Download size={16} /> Export Excel
            </a>
          </div>
        </div>
        <div className="hero-date glass-inner" aria-label="Tanggal hari ini">
          <span className="hero-day">{dayNum}</span>
          <span className="hero-daymeta">
            {dayName},
            <br />
            {monthName}
          </span>
        </div>
      </section>

      {/* 3 kartu statistik */}
      <section className="stat-row">
        <article className="stat-card glass accent-income">
          <div className="stat-head">
            <span className="stat-icon">
              <ArrowUp size={16} />
            </span>
            <span className="stat-label">Total Pemasukan</span>
          </div>
          <div className="stat-value">{money(stats.totalIncome)}</div>
          <div className="stat-foot">
            <span className="pill pill-income">+{stats.count ? transactions.filter((t) => t.type === 'income').length : 0} transaksi</span>
          </div>
        </article>

        <article className="stat-card glass accent-expense">
          <div className="stat-head">
            <span className="stat-icon">
              <ArrowDown size={16} />
            </span>
            <span className="stat-label">Total Pengeluaran</span>
          </div>
          <div className="stat-value">{money(stats.totalExpense)}</div>
          <div className="stat-foot">
            <span className="pill pill-expense">{transactions.filter((t) => t.type === 'expense').length} transaksi</span>
          </div>
        </article>

        <article className={`stat-card glass accent-profit${stats.profit < 0 ? ' is-negative' : ''}`}>
          <div className="stat-head">
            <span className="stat-icon">
              <Wallet size={16} />
            </span>
            <span className="stat-label">Total Profit</span>
          </div>
          <div className="stat-value">{money(stats.profit)}</div>
          <div className="stat-foot">
            <span className={`pill ${stats.profit >= 0 ? 'pill-income' : 'pill-expense'}`}>
              {stats.profit >= 0 ? 'Untung' : 'Rugi'} · Pemasukan − Pengeluaran
            </span>
          </div>
        </article>
      </section>

      {/* Grafik pemasukan mingguan + donut */}
      <section className="mid-row">
        <article className="glass chart-card">
          <div className="card-head">
            <div>
              <h3>Tren Pemasukan</h3>
              <p className="muted">12 minggu terakhir</p>
            </div>
            <div className="chart-total">
              <strong>{moneyShort(stats.totalIncome)}</strong>
              <span className={`trend-pill ${trend.up ? 'up' : 'down'}`}>
                <ArrowUp size={12} style={{ transform: trend.up ? 'none' : 'rotate(180deg)' }} />
                {trend.pct}%
              </span>
            </div>
          </div>
          <AreaChart data={chartData} height={170} color="#2563eb" labels={chartLabels} />
        </article>

        <article className="glass donut-card">
          <div className="card-head">
            <div>
              <h3>Rasio Profit</h3>
              <p className="muted">Pemasukan vs pengeluaran</p>
            </div>
            <Sparkle size={16} />
          </div>
          <div className="donut-wrap">
            <Donut
              value={stats.totalIncome}
              total={stats.totalIncome + stats.totalExpense || 1}
              size={158}
              color="#2563eb"
              label={
                stats.totalIncome + stats.totalExpense > 0
                  ? `${Math.round((stats.totalIncome / (stats.totalIncome + stats.totalExpense || 1)) * 100)}%`
                  : '—'
              }
              sublabel="pemasukan"
            />
            <ul className="donut-legend">
              <li>
                <i className="dot-blue" /> Pemasukan <strong>{moneyShort(stats.totalIncome)}</strong>
              </li>
              <li>
                <i className="dot-slate" /> Pengeluaran <strong>{moneyShort(stats.totalExpense)}</strong>
              </li>
              <li>
                <i className="dot-green" /> Profit <strong>{moneyShort(stats.profit)}</strong>
              </li>
            </ul>
          </div>
        </article>
      </section>

      {/* Transaksi terbaru + pengeluaran kategori + export */}
      <section className="bottom-row">
        <article className="glass recent-card">
          <div className="card-head">
            <div>
              <h3>Transaksi Terbaru</h3>
              <p className="muted">{recent.length} entri terakhir</p>
            </div>
            <Link to="/transactions" className="link-btn">
              Lihat semua →
            </Link>
          </div>
          <ul className="recent-list">
            {recent.length === 0 && <li className="empty-line">Belum ada transaksi.</li>}
            {recent.map((t) => (
              <li key={t.id} className="recent-item">
                <span className={`tx-badge ${t.type}`}>
                  {t.type === 'income' ? <ArrowDown size={14} /> : <ArrowUp size={14} />}
                </span>
                <div className="recent-meta">
                  <strong>{t.description}</strong>
                  <small>
                    {formatDate(t.date)} · {t.category || 'Lainnya'}
                  </small>
                </div>
                <span className={`amount ${t.type}`}>
                  {t.type === 'income' ? '+' : '−'} {money(t.amount)}
                </span>
              </li>
            ))}
          </ul>
        </article>

        <div className="side-stack">
          <article className="glass cats-card">
            <div className="card-head">
              <div>
                <h3>Pengeluaran per Kategori</h3>
                <p className="muted">Top {expenseCats.length} kategori</p>
              </div>
              <Chart size={16} />
            </div>
            {expenseCats.length === 0 ? (
              <p className="empty-line">Belum ada pengeluaran.</p>
            ) : (
              <ul className="cat-bars">
                {expenseCats.map((c, i) => (
                  <li key={c.name}>
                    <div className="cat-bar-head">
                      <span>{c.name}</span>
                      <strong>{moneyShort(c.value)}</strong>
                    </div>
                    <div className="cat-bar-track">
                      <div
                        className="cat-bar-fill"
                        style={{
                          width: `${Math.max(4, (c.value / totalExpenseCat) * 100)}%`,
                          background: `linear-gradient(90deg, ${PALETTE[i % PALETTE.length]}, ${PALETTE[i % PALETTE.length]}aa)`,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </article>

          <article className="glass export-card">
            <div className="export-icon">
              <Download size={22} />
            </div>
            <div>
              <h3>Export ke Excel</h3>
              <p className="muted">Unduh laporan lengkap (.xlsx) dengan ringkasan &amp; detail transaksi.</p>
            </div>
            <a href={exportUrl()} className="btn btn-primary btn-sm">
              Unduh Sekarang
            </a>
          </article>
        </div>
      </section>

      {/* Bar chart mingguan kecil */}
      <section className="glass week-card">
        <div className="card-head">
          <div>
            <h3>Aktivitas Mingguan</h3>
            <p className="muted">Pemasukan per minggu</p>
          </div>
        </div>
        <BarChart
          data={weeks.map((w, i) => ({
            label: i % 2 === 0 ? `M${12 - i}` : '',
            value: w.income,
            display: moneyShort(w.income),
          }))}
          height={110}
          color="#3b82f6"
        />
      </section>

      <footer className="page-footer">
        <p>
          Finance © 2026 · {formatLongDate(today)} · <strong>{formatDate(todayISO())}</strong>
        </p>
      </footer>
    </div>
  );
}
