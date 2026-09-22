import { useMemo, useState } from 'react';
import { useFinance } from '../hooks/useFinance.jsx';
import { money, moneyShort, formatDate, todayISO } from '../format.js';
import { exportUrl } from '../api.js';
import AreaChart from '../components/AreaChart.jsx';
import Donut from '../components/Donut.jsx';
import { ArrowUp, ArrowDown, Download, FileXls, Wallet } from '../components/Icons.jsx';

const PALETTE = ['#2563eb', '#7c3aed', '#0891b2', '#db2777', '#d97706', '#16a34a'];

function groupByPeriod(list, mode) {
  const map = new Map();
  for (const t of list) {
    let key;
    if (mode === 'day') key = t.date;
    else if (mode === 'week') {
      const d = new Date(t.date + 'T00:00:00');
      const day = (d.getDay() + 6) % 7; // Senin = 0
      d.setDate(d.getDate() - day);
      key = d.toISOString().slice(0, 10);
    } else key = t.date.slice(0, 7); // bulan
    const cur = map.get(key) || { income: 0, expense: 0 };
    if (t.type === 'income') cur.income += t.amount;
    else cur.expense += t.amount;
    map.set(key, cur);
  }
  return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

function byCategory(list, type) {
  const map = new Map();
  for (const t of list) {
    if (t.type !== type) continue;
    const k = t.category || 'Lainnya';
    map.set(k, (map.get(k) || 0) + t.amount);
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
}

export default function Reports() {
  const { transactions, loading, statsFor } = useFinance();

  // Default: 30 hari terakhir
  const defaultFrom = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    return d.toISOString().slice(0, 10);
  }, []);

  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(todayISO());
  const [type, setType] = useState('all');

  const filtered = useMemo(() => {
    let list = transactions;
    if (from) list = list.filter((t) => t.date >= from);
    if (to) list = list.filter((t) => t.date <= to);
    if (type !== 'all') list = list.filter((t) => t.type === type);
    return [...list].sort((a, b) => a.date.localeCompare(b.date));
  }, [transactions, from, to, type]);

  const st = statsFor(filtered);

  // Period mode otomatis
  const mode = useMemo(() => {
    if (!from || !to) return 'month';
    const days = (new Date(to) - new Date(from)) / 86400000;
    if (days <= 31) return 'day';
    if (days <= 92) return 'week';
    return 'month';
  }, [from, to]);

  const series = useMemo(() => groupByPeriod(filtered, mode), [filtered, mode]);
  const incomeSeries = series.map(([, v]) => v.income);
  const seriesLabels = series
    .filter((_, i) => series.length <= 8 || i % Math.ceil(series.length / 6) === 0)
    .map(([k]) => formatDate(k).replace(/ \d{4}$/, ''))
    .slice(0, 8);

  const expenseCats = useMemo(() => byCategory(filtered, 'expense'), [filtered]);
  const incomeCats = useMemo(() => byCategory(filtered, 'income'), [filtered]);

  const totalIncomeCats = incomeCats.reduce((s, c) => s + c.value, 0);
  const totalExpenseCats = expenseCats.reduce((s, c) => s + c.value, 0);

  function resetPeriod() {
    setFrom(defaultFrom);
    setTo(todayISO());
    setType('all');
  }

  return (
    <div className="page-title-block">
      <div className="title-row">
        <div>
          <h1 className="page-title">Laporan</h1>
          <p className="muted">Analisis keuangan &amp; export ke Excel</p>
        </div>
        <a href={exportUrl({ type, from, to })} className="btn btn-primary">
          <Download size={16} /> Export Excel
        </a>
      </div>

      {/* Filter periode */}
      <section className="glass filter-bar">
        <label className="field">
          <span>Dari tanggal</span>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label className="field">
          <span>Sampai</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
        <div className="field">
          <span>Jenis</span>
          <div className="chip-row">
            {[
              ['all', 'Semua'],
              ['income', 'Pemasukan'],
              ['expense', 'Pengeluaran'],
            ].map(([v, label]) => (
              <button
                key={v}
                type="button"
                className={`chip${type === v ? ' active' : ''}`}
                onClick={() => setType(v)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <button type="button" className="btn btn-glass btn-sm" onClick={resetPeriod}>
          Reset periode
        </button>
      </section>

      {/* Ringkasan */}
      <section className="stat-row">
        <article className="stat-card glass accent-income">
          <div className="stat-head">
            <span className="stat-icon">
              <ArrowDown size={15} />
            </span>
            <span className="stat-label">Pemasukan</span>
          </div>
          <div className="stat-value">{money(st.totalIncome)}</div>
          <div className="stat-foot">
            <span className="pill pill-income">{st.incomeCount} transaksi</span>
          </div>
        </article>
        <article className="stat-card glass accent-expense">
          <div className="stat-head">
            <span className="stat-icon">
              <ArrowUp size={15} />
            </span>
            <span className="stat-label">Pengeluaran</span>
          </div>
          <div className="stat-value">{money(st.totalExpense)}</div>
          <div className="stat-foot">
            <span className="pill pill-expense">{st.expenseCount} transaksi</span>
          </div>
        </article>
        <article className={`stat-card glass accent-profit${st.profit < 0 ? ' is-negative' : ''}`}>
          <div className="stat-head">
            <span className="stat-icon">
              <Wallet size={15} />
            </span>
            <span className="stat-label">Profit Periode</span>
          </div>
          <div className="stat-value">{money(st.profit)}</div>
          <div className="stat-foot">
            <span className={`pill ${st.profit >= 0 ? 'pill-income' : 'pill-expense'}`}>
              {st.count} total transaksi
            </span>
          </div>
        </article>
      </section>

      {/* Chart tren + donut */}
      <section className="mid-row">
        <article className="glass chart-card">
          <div className="card-head">
            <div>
              <h3>Tren Pemasukan Periode</h3>
              <p className="muted">
                {from ? formatDate(from) : '…'} — {to ? formatDate(to) : '…'} · per{' '}
                {mode === 'day' ? 'hari' : mode === 'week' ? 'minggu' : 'bulan'}
              </p>
            </div>
            <strong className="chart-big">{moneyShort(st.totalIncome)}</strong>
          </div>
          <AreaChart data={incomeSeries.length ? incomeSeries : [0]} height={180} color="#2563eb" labels={seriesLabels} />
        </article>

        <article className="glass donut-card">
          <div className="card-head">
            <div>
              <h3>Komposisi</h3>
              <p className="muted">Pemasukan vs pengeluaran</p>
            </div>
          </div>
          <div className="donut-wrap">
            <Donut
              value={st.totalIncome}
              total={st.totalIncome + st.totalExpense || 1}
              size={150}
              color={st.profit >= 0 ? '#2563eb' : '#dc2626'}
              label={`${st.totalIncome + st.totalExpense > 0 ? Math.round((st.totalIncome / (st.totalIncome + st.totalExpense)) * 100) : 0}%`}
              sublabel="pemasukan"
            />
            <ul className="donut-legend">
              <li>
                <i className="dot-blue" /> Masuk <strong>{moneyShort(st.totalIncome)}</strong>
              </li>
              <li>
                <i className="dot-slate" /> Keluar <strong>{moneyShort(st.totalExpense)}</strong>
              </li>
              <li>
                <i className={st.profit >= 0 ? 'dot-green' : 'dot-red'} /> Profit{' '}
                <strong>{moneyShort(st.profit)}</strong>
              </li>
            </ul>
          </div>
        </article>
      </section>

      {/* Kategori */}
      <section className="cats-grid">
        <article className="glass">
          <div className="card-head">
            <div>
              <h3>Pemasukan per Kategori</h3>
              <p className="muted">Distribusi pemasukan</p>
            </div>
          </div>
          {incomeCats.length === 0 ? (
            <p className="empty-line">Tidak ada data pemasukan di periode ini.</p>
          ) : (
            <ul className="cat-bars">
              {incomeCats.map((c, i) => (
                <li key={c.name}>
                  <div className="cat-bar-head">
                    <span>{c.name}</span>
                    <strong>{moneyShort(c.value)}</strong>
                  </div>
                  <div className="cat-bar-track">
                    <div
                      className="cat-bar-fill"
                      style={{
                        width: `${Math.max(4, (c.value / totalIncomeCats) * 100)}%`,
                        background: `linear-gradient(90deg, #16a34a, ${PALETTE[(i + 5) % PALETTE.length]})`,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="glass">
          <div className="card-head">
            <div>
              <h3>Pengeluaran per Kategori</h3>
              <p className="muted">Distribusi pengeluaran</p>
            </div>
          </div>
          {expenseCats.length === 0 ? (
            <p className="empty-line">Tidak ada data pengeluaran di periode ini.</p>
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
                        width: `${Math.max(4, (c.value / totalExpenseCats) * 100)}%`,
                        background: `linear-gradient(90deg, #dc2626, ${PALETTE[i % PALETTE.length]})`,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      {/* CTA Export */}
      <section className="glass export-cta">
        <div className="export-icon big">
          <FileXls size={26} />
        </div>
        <div className="export-copy">
          <h3>Siap unduh laporan?</h3>
          <p className="muted">
            File Excel berisi sheet <strong>Ringkasan</strong> (total pemasukan, pengeluaran, profit) dan{' '}
            <strong>Transaksi</strong> (detail + baris total). Filter periode &amp; jenis di atas ikut
            diterapkan.
          </p>
        </div>
        <a href={exportUrl({ type, from, to })} className="btn btn-primary">
          <Download size={16} /> Download .xlsx
        </a>
      </section>

      {loading && <p className="muted">Memuat…</p>}
    </div>
  );
}
