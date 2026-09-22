import { useMemo, useState } from 'react';
import { useFinance } from '../hooks/useFinance.jsx';
import { useToast } from '../components/Toast.jsx';
import { money, formatDate, todayISO } from '../format.js';
import { exportUrl } from '../api.js';
import { ArrowUp, ArrowDown, Pencil, Trash, Plus, Download, Search } from '../components/Icons.jsx';

const INCOME_CATS = ['Penjualan', 'Jasa', 'Bonus', 'Investasi', 'Lainnya (Pemasukan)'];
const EXPENSE_CATS = ['Bahan Baku', 'Operasional', 'Gaji', 'Sewa', 'Transportasi', 'Marketing', 'Lainnya (Pengeluaran)'];

const emptyForm = () => ({
  type: 'income',
  amount: '',
  date: todayISO(),
  category: INCOME_CATS[0],
  description: '',
});

export default function Transactions() {
  const { transactions, loading, addTransaction, updateTransaction, deleteTransaction, statsFor } = useFinance();
  const showToast = useToast();

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    let list = transactions;
    if (typeFilter !== 'all') list = list.filter((t) => t.type === typeFilter);
    if (from) list = list.filter((t) => t.date >= from);
    if (to) list = list.filter((t) => t.date <= to);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (t) =>
          t.description.toLowerCase().includes(q) ||
          (t.category || '').toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) =>
      a.date === b.date ? (b.createdAt || '').localeCompare(a.createdAt || '') : b.date.localeCompare(a.date)
    );
  }, [transactions, typeFilter, from, to, query]);

  const visibleStats = statsFor(filtered);

  function setType(type) {
    setForm((f) => ({
      ...f,
      type,
      category: type === 'income' ? INCOME_CATS[0] : EXPENSE_CATS[0],
    }));
  }

  function resetForm() {
    setForm(emptyForm());
    setEditingId(null);
    setFormError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setFormError('Nominal harus lebih besar dari 0.');
      return;
    }
    if (!form.date) {
      setFormError('Tanggal wajib diisi.');
      return;
    }
    if (!form.description.trim()) {
      setFormError('Keterangan wajib diisi.');
      return;
    }
    const payload = {
      type: form.type,
      amount,
      date: form.date,
      category: form.category,
      description: form.description.trim(),
    };
    setBusy(true);
    try {
      if (editingId) {
        await updateTransaction(editingId, payload);
        showToast('Transaksi diperbarui ✓');
        resetForm();
      } else {
        await addTransaction(payload);
        showToast(payload.type === 'income' ? 'Pemasukan ditambahkan ✓' : 'Pengeluaran ditambahkan ✓');
        setForm((f) => ({ ...emptyForm(), type: f.type, category: f.category }));
      }
    } catch (err) {
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function startEdit(t) {
    setEditingId(t.id);
    setForm({
      type: t.type,
      amount: String(t.amount),
      date: t.date,
      category: t.category || (t.type === 'income' ? INCOME_CATS[0] : EXPENSE_CATS[0]),
      description: t.description,
    });
    setFormError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleDelete(t) {
    if (!window.confirm(`Hapus transaksi "${t.description}" senilai ${money(t.amount)}?`)) return;
    try {
      await deleteTransaction(t.id);
      if (editingId === t.id) resetForm();
      showToast('Transaksi dihapus');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  const cats = form.type === 'income' ? INCOME_CATS : EXPENSE_CATS;

  return (
    <div className="page-title-block">
      <div className="title-row">
        <div>
          <h1 className="page-title">Transaksi</h1>
          <p className="muted">Kelola pemasukan dan pengeluaran bisnis Anda</p>
        </div>
        <a href={exportUrl({ type: typeFilter, from, to })} className="btn btn-glass">
          <Download size={16} /> Export Excel
        </a>
      </div>

      <div className="tx-layout">
        {/* ===== Form ===== */}
        <aside className="glass form-panel">
          <div className="card-head">
            <h3>{editingId ? 'Ubah Transaksi' : 'Tambah Transaksi'}</h3>
            {editingId && (
              <button type="button" className="link-btn" onClick={resetForm}>
                Batal
              </button>
            )}
          </div>

          <div className="type-toggle" role="tablist" aria-label="Jenis transaksi">
            <button
              type="button"
              role="tab"
              aria-selected={form.type === 'income'}
              className={`type-btn income${form.type === 'income' ? ' active' : ''}`}
              onClick={() => setType('income')}
            >
              <ArrowDown size={14} /> Pemasukan
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={form.type === 'expense'}
              className={`type-btn expense${form.type === 'expense' ? ' active' : ''}`}
              onClick={() => setType('expense')}
            >
              <ArrowUp size={14} /> Pengeluaran
            </button>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <label className="field">
              <span>Nominal (Rp)</span>
              <input
                type="number"
                min="1"
                step="any"
                inputMode="numeric"
                placeholder="0"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
              />
            </label>

            <div className="field-row">
              <label className="field">
                <span>Tanggal</span>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />
              </label>
              <label className="field">
                <span>Kategori</span>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {cats.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="field">
              <span>Keterangan</span>
              <input
                type="text"
                maxLength={200}
                placeholder="mis. Penjualan kopi pagi"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
              />
            </label>

            {formError && (
              <p className="form-error" role="alert">
                {formError}
              </p>
            )}

            <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
              <Plus size={16} />
              {busy ? 'Menyimpan…' : editingId ? 'Simpan Perubahan' : form.type === 'income' ? 'Simpan Pemasukan' : 'Simpan Pengeluaran'}
            </button>
          </form>

          {/* Filter */}
          <div className="filters">
            <p className="filter-title">Filter</p>
            <div className="chip-row">
              {[
                ['all', 'Semua'],
                ['income', 'Pemasukan'],
                ['expense', 'Pengeluaran'],
              ].map(([v, label]) => (
                <button
                  key={v}
                  type="button"
                  className={`chip${typeFilter === v ? ' active' : ''}`}
                  onClick={() => setTypeFilter(v)}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="field-row">
              <label className="field">
                <span>Dari</span>
                <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              </label>
              <label className="field">
                <span>Sampai</span>
                <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
              </label>
            </div>
            <label className="field">
              <span>Cari</span>
              <span className="input-icon">
                <Search size={15} />
                <input
                  type="search"
                  placeholder="Keterangan / kategori…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </span>
            </label>
            {(from || to || query || typeFilter !== 'all') && (
              <button
                type="button"
                className="link-btn"
                onClick={() => {
                  setFrom('');
                  setTo('');
                  setQuery('');
                  setTypeFilter('all');
                }}
              >
                Reset filter
              </button>
            )}
          </div>
        </aside>

        {/* ===== Tabel ===== */}
        <section className="glass table-panel">
          <div className="card-head">
            <div>
              <h3>Riwayat Transaksi</h3>
              <p className="muted">{filtered.length} data ditampilkan</p>
            </div>
            <div className="mini-stats">
              <span className="pill pill-income">+{money(visibleStats.totalIncome)}</span>
              <span className="pill pill-expense">−{money(visibleStats.totalExpense)}</span>
              <span className={`pill ${visibleStats.profit >= 0 ? 'pill-income' : 'pill-expense'}`}>
                Profit {money(visibleStats.profit)}
              </span>
            </div>
          </div>

          {loading ? (
            <div className="table-loading">Memuat data…</div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📒</div>
              <p>Tidak ada transaksi.</p>
              <p className="muted">Tambahkan lewat formulir di samping atau ubah filter.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th className="th-date">Tanggal</th>
                    <th>Keterangan</th>
                    <th className="th-cat">Kategori</th>
                    <th className="th-amount">Nominal</th>
                    <th className="th-act" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t) => (
                    <tr key={t.id} className={editingId === t.id ? 'editing' : ''}>
                      <td className="td-date">{formatDate(t.date)}</td>
                      <td>
                        <div className="tx-main">
                          <span className={`tx-badge ${t.type}`}>
                            {t.type === 'income' ? <ArrowDown size={14} /> : <ArrowUp size={14} />}
                          </span>
                          <div>
                            <div className="tx-desc">{t.description}</div>
                            <div className="tx-sub">
                              {formatDate(t.date)} · {t.category || 'Lainnya'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="td-cat">
                        <span className="cat-tag">{t.category || 'Lainnya'}</span>
                      </td>
                      <td className={`amount ${t.type}`}>
                        {t.type === 'income' ? '+' : '−'} {money(t.amount)}
                      </td>
                      <td>
                        <div className="row-actions">
                          <button type="button" className="icon-btn" title="Ubah" onClick={() => startEdit(t)}>
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            className="icon-btn danger"
                            title="Hapus"
                            onClick={() => handleDelete(t)}
                          >
                            <Trash size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="table-foot">
            <div>
              <i className="dot-green" /> Pemasukan <strong>{money(visibleStats.totalIncome)}</strong>
            </div>
            <div>
              <i className="dot-red" /> Pengeluaran <strong>{money(visibleStats.totalExpense)}</strong>
            </div>
            <div>
              <i className="dot-blue" /> Profit <strong>{money(visibleStats.profit)}</strong>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
