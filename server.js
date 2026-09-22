/**
 * Finance — Software Pemasukan, Pengeluaran & Total Profit
 * Backend: Express + penyimpanan JSON + export Excel (ExcelJS)
 */
const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const ExcelJS = require('exceljs');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'transactions.json');

app.use(express.json());
/* Static: build React (client/dist) */
const DIST = path.join(__dirname, 'client', 'dist');
if (!fs.existsSync(DIST)) {
  console.warn('[warning] client/dist belum ada — jalankan: npm run build');
}
app.use(
  express.static(DIST, {
    index: false,
    maxAge: '1h',
    setHeaders: (res, filePath) => {
      if (filePath.includes(`${path.sep}assets${path.sep}`)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    },
  })
);

/* ---------------- Penyimpanan ---------------- */
function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]', 'utf8');
}

function loadTransactions() {
  ensureStore();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveTransactions(list) {
  ensureStore();
  const tmp = DATA_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(list, null, 2), 'utf8');
  fs.renameSync(tmp, DATA_FILE);
}

function computeStats(list) {
  let totalIncome = 0;
  let totalExpense = 0;
  for (const t of list) {
    const amt = Number(t.amount) || 0;
    if (t.type === 'income') totalIncome += amt;
    else if (t.type === 'expense') totalExpense += amt;
  }
  return {
    totalIncome,
    totalExpense,
    profit: totalIncome - totalExpense,
    count: list.length,
  };
}

const RUPAULT = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function formatIDR(n) {
  return RUPAULT.format(n);
}

/* ---------------- Validasi ---------------- */
function validatePayload(body) {
  const errors = [];
  const type = body.type;
  if (type !== 'income' && type !== 'expense') {
    errors.push('Jenis transaksi harus "income" (pemasukan) atau "expense" (pengeluaran).');
  }
  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    errors.push('Nominal harus angka lebih besar dari 0.');
  }
  const description = String(body.description || '').trim();
  if (!description) errors.push('Deskripsi wajib diisi.');
  const date = String(body.date || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) {
    errors.push('Tanggal tidak valid.');
  }
  const category = String(body.category || '').trim() || 'Lainnya';
  if (errors.length) return { errors };
  return {
    errors: null,
    data: { type, amount, description, date, category },
  };
}

/* ---------------- API ---------------- */

// Ambil semua transaksi + statistik
app.get('/api/transactions', (req, res) => {
  const list = loadTransactions().sort((a, b) => {
    if (a.date === b.date) return (b.createdAt || '').localeCompare(a.createdAt || '');
    return b.date.localeCompare(a.date);
  });
  res.json({ transactions: list, stats: computeStats(list) });
});

// Tambah transaksi
app.post('/api/transactions', (req, res) => {
  const { errors, data } = validatePayload(req.body || {});
  if (errors) return res.status(400).json({ errors });

  const list = loadTransactions();
  const tx = {
    id: crypto.randomUUID(),
    ...data,
    createdAt: new Date().toISOString(),
  };
  list.push(tx);
  saveTransactions(list);
  res.status(201).json({ transaction: tx, stats: computeStats(list) });
});

// Ubah transaksi
app.put('/api/transactions/:id', (req, res) => {
  const { errors, data } = validatePayload(req.body || {});
  if (errors) return res.status(400).json({ errors });

  const list = loadTransactions();
  const idx = list.findIndex((t) => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ errors: ['Transaksi tidak ditemukan.'] });

  list[idx] = { ...list[idx], ...data };
  saveTransactions(list);
  res.json({ transaction: list[idx], stats: computeStats(list) });
});

// Hapus transaksi
app.delete('/api/transactions/:id', (req, res) => {
  const list = loadTransactions();
  const idx = list.findIndex((t) => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ errors: ['Transaksi tidak ditemukan.'] });
  list.splice(idx, 1);
  saveTransactions(list);
  res.json({ stats: computeStats(list) });
});

// Statistik ringkas
app.get('/api/stats', (req, res) => {
  res.json(computeStats(loadTransactions()));
});

/**
 * Export ke Excel.
 * Query: ?type=all|income|expense&from=YYYY-MM-DD&to=YYYY-MM-DD
 */
app.get('/api/export/excel', async (req, res) => {
  try {
    const typeFilter = String(req.query.type || 'all');
    const from = String(req.query.from || '');
    const to = String(req.query.to || '');

    let list = loadTransactions();
    if (typeFilter === 'income' || typeFilter === 'expense') {
      list = list.filter((t) => t.type === typeFilter);
    }
    if (from) list = list.filter((t) => t.date >= from);
    if (to) list = list.filter((t) => t.date <= to);
    list.sort((a, b) => a.date.localeCompare(b.date));

    const stats = computeStats(list);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Finance App';
    workbook.created = new Date();

    /* ---------- Sheet 1: Ringkasan ---------- */
    const summary = workbook.addWorksheet('Ringkasan', {
      properties: { tabColor: { argb: 'FF16A34A' } },
      views: [{ showGridLines: false }],
    });

    summary.columns = [{ width: 28 }, { width: 22 }, { width: 0 }];
    summary.mergeCells('A1:B1');
    const titleCell = summary.getCell('A1');
    titleCell.value = 'LAPORAN KEUANGAN';
    titleCell.font = { size: 18, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    summary.getRow(1).height = 34;

    summary.mergeCells('A2:B2');
    const subCell = summary.getCell('A2');
    subCell.value =
      'Periode: ' +
      (from && to ? `${from} s/d ${to}` : from ? `Sejak ${from}` : to ? `Sampai ${to}` : 'Semua data') +
      (typeFilter === 'income' ? ' · Pemasukan saja' : typeFilter === 'expense' ? ' · Pengeluaran saja' : '');
    subCell.font = { size: 10, italic: true, color: { argb: 'FF64748B' } };
    subCell.alignment = { horizontal: 'center' };
    summary.getRow(2).height = 20;

    const moneyFmt = '"Rp" #,##0;[Red]-"Rp" #,##0';
    const rows = [
      ['Total Pemasukan', stats.totalIncome, 'FF16A34A'],
      ['Total Pengeluaran', stats.totalExpense, 'FFDC2626'],
      ['TOTAL PROFIT', stats.profit, stats.profit >= 0 ? 'FF2563EB' : 'FFDC2626'],
      ['Jumlah Transaksi', stats.count, 'FF64748B'],
    ];
    let r = 4;
    for (const [label, value, color] of rows) {
      const labelCell = summary.getCell(`A${r}`);
      const valueCell = summary.getCell(`B${r}`);
      labelCell.value = label;
      valueCell.value = value;
      labelCell.font = { bold: true, size: 12, color: { argb: 'FF0F172A' } };
      labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      valueCell.font = { bold: true, size: 12, color: { argb: color } };
      valueCell.alignment = { horizontal: 'right' };
      valueCell.numFmt = label === 'Jumlah Transaksi' ? '#,##0' : moneyFmt;
      labelCell.border = valueCell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
      summary.getRow(r).height = 22;
      r += 1;
    }

    /* ---------- Sheet 2: Detail Transaksi ---------- */
    const detail = workbook.addWorksheet('Transaksi', {
      properties: { tabColor: { argb: 'FF2563EB' } },
    });

    detail.columns = [
      { header: 'No', key: 'no', width: 6 },
      { header: 'Tanggal', key: 'date', width: 14 },
      { header: 'Jenis', key: 'type', width: 14 },
      { header: 'Kategori', key: 'category', width: 18 },
      { header: 'Deskripsi', key: 'description', width: 40 },
      { header: 'Pemasukan', key: 'income', width: 16 },
      { header: 'Pengeluaran', key: 'expense', width: 16 },
    ];

    // Header style
    const headerRow = detail.getRow(1);
    headerRow.height = 22;
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        bottom: { style: 'medium', color: { argb: 'FF2563EB' } },
      };
    });

    list.forEach((t, i) => {
      const row = detail.addRow({
        no: i + 1,
        date: t.date,
        type: t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
        category: t.category || 'Lainnya',
        description: t.description,
        income: t.type === 'income' ? t.amount : null,
        expense: t.type === 'expense' ? t.amount : null,
      });
      row.getCell('income').numFmt = moneyFmt;
      row.getCell('expense').numFmt = moneyFmt;
      row.getCell('income').alignment = { horizontal: 'right' };
      row.getCell('expense').alignment = { horizontal: 'right' };
      row.getCell('type').alignment = { horizontal: 'center' };
      const typeCell = row.getCell('type');
      if (t.type === 'income') {
        typeCell.font = { color: { argb: 'FF16A34A' }, bold: true };
      } else {
        typeCell.font = { color: { argb: 'FFDC2626' }, bold: true };
      }
      if (i % 2 === 1) {
        row.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
        });
      }
    });

    // Baris total
    const totalRow = detail.addRow({
      no: '',
      date: '',
      type: '',
      category: '',
      description: 'TOTAL',
      income: stats.totalIncome,
      expense: stats.totalExpense,
    });
    totalRow.font = { bold: true };
    totalRow.getCell('description').alignment = { horizontal: 'right' };
    totalRow.getCell('income').numFmt = moneyFmt;
    totalRow.getCell('expense').numFmt = moneyFmt;
    totalRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } };
      cell.border = { top: { style: 'double', color: { argb: 'FF2563EB' } } };
    });

    // Profit row
    const profitRow = detail.addRow({
      no: '',
      date: '',
      type: '',
      category: '',
      description: 'TOTAL PROFIT',
      income: stats.profit,
      expense: null,
    });
    profitRow.font = { bold: true, color: { argb: stats.profit >= 0 ? 'FF2563EB' : 'FFDC2626' } };
    profitRow.getCell('description').alignment = { horizontal: 'right' };
    profitRow.getCell('income').numFmt = moneyFmt;
    profitRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } };
    });

    detail.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: 7 },
    };

    const buffer = await workbook.xlsx.writeBuffer();
    const stamp = new Date().toISOString().slice(0, 10);
    const filename = `laporan-keuangan-${stamp}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`
    );
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ errors: ['Gagal membuat file Excel.'] });
  }
});

/* ---------- Fallback SPA → React index.html ---------- */
app.use((req, res, next) => {
  if (req.method !== 'GET' || req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(DIST, 'index.html'), (err) => {
    if (err) res.status(500).send('Build belum tersedia — jalankan: npm run build');
  });
});

/* API 404 */
app.use('/api', (req, res) => {
  res.status(404).json({ errors: ['Endpoint tidak ditemukan.'] });
});

app.listen(PORT, '0.0.0.0', () => {
  ensureStore();
  console.log(`Finance app berjalan di http://0.0.0.0:${PORT}`);
});
