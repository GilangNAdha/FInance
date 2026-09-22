import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useToast } from '../components/Toast.jsx';
import { api, exportUrl } from '../api.js';
import { money } from '../format.js';
import {
  aoaToGrid,
  cellName,
  downloadBlob,
  emptyGrid,
  evaluateSheet,
  indexToCol,
  readFileBuffer,
} from '../lib/officeUtils.js';
import { usePendingFile } from './DocEditor.jsx';

const ROWS = 60;
const COLS = 14; // A..N

export default function SheetEditor() {
  const showToast = useToast();
  const [title, setTitle] = useState('Lembar Tanpa Judul');
  const [grid, setGrid] = useState(() => emptyGrid(ROWS, COLS));
  const [sel, setSel] = useState({ r: 0, c: 0 });
  const [editing, setEditing] = useState(false);
  const [fx, setFx] = useState('');
  const fileRef = useRef(null);
  const pendingFile = usePendingFile();

  const display = useMemo(() => evaluateSheet(grid), [grid]);
  const selRaw = grid[sel.r]?.[sel.c] ?? '';

  /* Sinkronkan fx bar saat selection berubah */
  useEffect(() => {
    setFx(selRaw);
  }, [sel.r, sel.c, selRaw]);

  const setCell = useCallback((r, c, val) => {
    setGrid((g) => {
      const next = g.map((row) => [...row]);
      next[r][c] = val;
      return next;
    });
  }, []);

  /* Buka file (pending dari hub atau input) */
  const loadFile = useCallback(
    async (file) => {
      if (!file) return;
      const ext = (file.name.split('.').pop() || '').toLowerCase();
      const base = file.name.replace(/\.[^.]+$/, '');
      setTitle(base || 'Lembar');
      try {
        if (ext === 'csv') {
          const text = await file.text();
          const XLSX = await import('xlsx');
          const wb = XLSX.read(text, { type: 'string' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' });
          setGrid(aoaToGrid(aoa, ROWS, COLS));
          showToast('CSV dibuka ✓');
          return;
        }
        if (['xlsx', 'xls'].includes(ext)) {
          const buf = await readFileBuffer(file);
          const XLSX = await import('xlsx');
          const wb = XLSX.read(buf, { type: 'array' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' });
          setGrid(aoaToGrid(aoa, ROWS, COLS));
          showToast(`Workbook dibuka — sheet "${wb.SheetNames[0]}" ✓`);
          return;
        }
        showToast(`Format .${ext} tidak didukung (pakai xlsx/xls/csv)`, 'error');
      } catch (err) {
        console.error(err);
        showToast(`Gagal membuka file: ${err.message}`, 'error');
      }
    },
    [showToast]
  );

  useEffect(() => {
    if (pendingFile) loadFile(pendingFile);
  }, [pendingFile, loadFile]);

  /* Ekspor .xlsx */
  async function saveXlsx() {
    try {
      const XLSX = await import('xlsx');
      const aoa = grid.map((row, r) =>
        row.map((v, c) => {
          // ekspor nilai hasil evaluasi untuk formula, angka sebagai number
          if (typeof v === 'string' && v.startsWith('=')) {
            const num = Number(display[r][c]);
            return Number.isFinite(num) && display[r][c] !== '' ? num : display[r][c];
          }
          const n = Number(v);
          return v !== '' && Number.isFinite(n) ? n : v;
        })
      );
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      downloadBlob(new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${sanitize(title)}.xlsx`);
      showToast('File .xlsx diunduh ✓');
    } catch (err) {
      console.error(err);
      showToast('Gagal membuat .xlsx', 'error');
    }
  }

  /* Ekspor CSV */
  function saveCsv() {
    const csv = display
      .map((row) =>
        row
          .map((v) => {
            const s = String(v ?? '');
            return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
          })
          .join(',')
      )
      .join('\n');
    downloadBlob(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }), `${sanitize(title)}.csv`);
    showToast('File .csv diunduh ✓');
  }

  /* Isi dari data transaksi keuangan */
  async function loadFromFinance() {
    try {
      const data = await api.list();
      const rows = [
        ['Tanggal', 'Jenis', 'Kategori', 'Keterangan', 'Nominal'],
        ...data.transactions.map((t) => [
          t.date,
          t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
          t.category || 'Lainnya',
          t.description,
          t.amount,
        ]),
        [],
        ['Total Pemasukan', '', '', '', `=SUM(E2:E${data.transactions.length + 1})`],
      ];
      // Hitung manual untuk baris pemasukan: pakai SUMIF-like via helper rows
      const incomeTotal = data.transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const expenseTotal = data.transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      rows.push(['Total Pengeluaran', '', '', '', expenseTotal]);
      rows.push(['TOTAL PROFIT', '', '', '', incomeTotal - expenseTotal]);
      // Ganti formula pemasukan dengan angka pasti agar konsisten
      rows[rows.length - 3][4] = incomeTotal;

      const g = aoaToGrid(rows, ROWS, COLS);
      setGrid(g);
      setSel({ r: 0, c: 0 });
      setTitle('Data Keuangan');
      showToast('Data keuangan dimuat ke lembar ✓');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  function newSheet() {
    setGrid(emptyGrid(ROWS, COLS));
    setSel({ r: 0, c: 0 });
    setTitle('Lembar Tanpa Judul');
    showToast('Lembar baru');
  }

  /* Keyboard navigation */
  function onKeyDown(e) {
    if (editing) {
      if (e.key === 'Enter') {
        e.preventDefault();
        setEditing(false);
        moveSel(1, 0);
      } else if (e.key === 'Escape') {
        setEditing(false);
        setFx(selRaw);
      } else if (e.key === 'Tab') {
        e.preventDefault();
        setEditing(false);
        moveSel(0, e.shiftKey ? -1 : 1);
      }
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        moveSel(1, 0);
        break;
      case 'ArrowUp':
        e.preventDefault();
        moveSel(-1, 0);
        break;
      case 'ArrowRight':
        e.preventDefault();
        moveSel(0, 1);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        moveSel(0, -1);
        break;
      case 'Enter':
        e.preventDefault();
        setEditing(true);
        break;
      case 'Tab':
        e.preventDefault();
        moveSel(0, e.shiftKey ? -1 : 1);
        break;
      case 'Delete':
      case 'Backspace':
        setCell(sel.r, sel.c, '');
        break;
      default:
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          setEditing(true); // mulai mengetik → mode edit (nilai ditangani input)
        }
        break;
    }
  }

  function moveSel(dr, dc) {
    setEditing(false);
    setSel((s) => ({
      r: Math.max(0, Math.min(ROWS - 1, s.r + dr)),
      c: Math.max(0, Math.min(COLS - 1, s.c + dc)),
    }));
  }

  /* Commit fx bar */
  function commitFx(e) {
    e.preventDefault();
    setCell(sel.r, sel.c, fx);
    setEditing(false);
    // fokus tetap di fx agar bisa enter lagi
  }

  const colHeaders = Array.from({ length: COLS }, (_, i) => indexToCol(i));

  return (
    <div className="office-shell">
      <div className="editor-head">
        <input
          className="editor-title-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="Judul lembar"
        />
        <div className="editor-actions">
          <button type="button" className="btn btn-glass btn-sm" onClick={newSheet}>
            ➕ Baru
          </button>
          <button type="button" className="btn btn-glass btn-sm" onClick={() => fileRef.current?.click()}>
            📂 Buka XLSX/CSV
          </button>
          <button type="button" className="btn btn-glass btn-sm" onClick={loadFromFinance}>
            💰 Data Keuangan
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={saveXlsx}>
            ⬇ Unduh .xlsx
          </button>
          <button type="button" className="btn btn-glass btn-sm" onClick={saveCsv}>
            CSV
          </button>
          <a href={exportUrl()} className="btn btn-glass btn-sm">
            Laporan Server
          </a>
        </div>
        <input
          ref={fileRef}
          type="file"
          className="tb-fileinput"
          accept=".xlsx,.xls,.csv"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) loadFile(f);
            e.target.value = '';
          }}
        />
      </div>

      {/* Formula bar */}
      <form className="fx-bar" onSubmit={commitFx}>
        <span className="fx-label">fx</span>
        <span className="fx-cellname">{cellName(sel.r, sel.c)}</span>
        <input
          className="fx-input"
          value={fx}
          onChange={(e) => setFx(e.target.value)}
          placeholder="Isi nilai atau formula (contoh: =SUM(A1:A10))"
          spellCheck={false}
          aria-label="Formula bar"
        />
      </form>

      {/* Grid */}
      <div className="sheet-wrap" onKeyDown={onKeyDown} tabIndex={0}>
        <table className="sheet-grid">
          <thead>
            <tr>
              <th className="corner" />
              {colHeaders.map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.map((row, r) => (
              <tr key={r}>
                <td className="row-h">{r + 1}</td>
                {row.map((raw, c) => {
                  const isSel = sel.r === r && sel.c === c;
                  const shown = display[r][c] ?? '';
                  const isNum = shown !== '' && Number.isFinite(Number(shown)) && !String(raw).startsWith('=');
                  const isFormula = String(raw).startsWith('=');
                  return (
                    <td
                      key={c}
                      className={`sheet-td${isSel ? ' selected' : ''}`}
                      onClick={() => {
                        setSel({ r, c });
                        setEditing(false);
                      }}
                      onDoubleClick={() => setEditing(true)}
                    >
                      {isSel && editing ? (
                        <input
                          className="sheet-cell"
                          autoFocus
                          defaultValue={raw}
                          onBlur={(e) => {
                            setCell(r, c, e.target.value);
                            setEditing(false);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              setCell(r, c, e.target.value);
                              setEditing(false);
                              moveSel(1, 0);
                            } else if (e.key === 'Escape') {
                              setEditing(false);
                            }
                          }}
                        />
                      ) : (
                        <div
                          className={`sheet-cell${isNum || isFormula ? ' num' : ''}`}
                          style={
                            isFormula
                              ? { color: 'var(--blue)', fontWeight: 600 }
                              : String(shown).startsWith('#')
                              ? { color: 'var(--red)', fontWeight: 700 }
                              : undefined
                          }
                          title={isFormula ? raw : undefined}
                        >
                          {shown}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="sheet-tabs">
        <button type="button" className="sheet-tab active">
          Sheet1
        </button>
        <span className="muted" style={{ fontSize: '0.72rem' }}>
          {ROWS} baris × {COLS} kolom · formula aktif: SUM, AVERAGE, MIN, MAX, COUNT, ROUND, ABS
        </span>
        <span style={{ flex: 1 }} />
        <span className="pill pill-income">Profit: {money(evaluateProfit(display))}</span>
      </div>
    </div>
  );
}

/** Cari baris "TOTAL PROFIT" / nilai profit di sheet (kolom terakhir) */
function evaluateProfit(display) {
  for (const row of display) {
    const last = String(row[row.length - 1] ?? '');
    if (row.some((v) => /profit/i.test(String(v))) && last !== '' && Number.isFinite(Number(last))) {
      return Number(last);
    }
  }
  return 0;
}

function sanitize(s) {
  return (s || 'lembar').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-') || 'lembar';
}
