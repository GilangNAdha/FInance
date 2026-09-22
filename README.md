# Finance — Catatan Pemasukan, Pengeluaran & Profit

Software keuangan berbasis web dengan UI **glassmorphism** & **animasi gradient wave**, dibangun dengan **React + Express**. Mencatat pemasukan dan pengeluaran, melihat total profit, **export laporan ke Excel (.xlsx)**, plus **Office Suite** (editor Word/DOC, Excel, PDF, Markdown).

![Node](https://img.shields.io/badge/Node.js-22-blue) ![React](https://img.shields.io/badge/React-18-61dafb) ![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Fitur

- 🎨 UI glassmorphism modern + gradient wave animation + center dock navigation
- 📊 Dashboard: kartu total pemasukan / pengeluaran / profit, tren grafik, donut rasio, top kategori
- ➕ CRUD transaksi (tambah, ubah, hapus) dengan validasi
- 🔎 Filter: jenis transaksi, rentang tanggal, pencarian
- 📄 **Multi-page**: Beranda · Transaksi · Laporan · **Office** · Pengaturan (+ 404)
- 📥 **Export Excel** 2 sheet: *Ringkasan* & *Transaksi* (format Rupiah, auto-filter, baris TOTAL & PROFIT)
- 📝 **Office Suite** (`/office`) — terinspirasi [GenOffice](https://github.com/genspark-ai/genoffice) & [MS-365-Electron](https://github.com/agam778/MS-365-Electron):
  - **Dokumen Word** (`/office/doc`) — editor rich-text, buka `.docx` (mammoth), unduh `.docx`/HTML, cetak ke PDF
  - **Spreadsheet** (`/office/sheet`) — grid + formula (`SUM`, `AVERAGE`, `MIN`, `MAX`, `COUNT`, `ROUND`, `ABS`, range, persen, deteksi sirkular), buka/unduh `.xlsx`/`.csv`, tombol **Data Keuangan** mengisi sheet dari transaksi
  - **PDF** (`/office/pdf`) — pratinjau pdf.js, rotasi 90°, gabung banyak PDF (pdf-lib), unduh — semua lokal di browser
  - **Markdown** (`/office/markdown`) — editor + pratinjau live, ekspor `.md`/HTML
  - Dropzone hub menerima DOCX/XLSX/PDF/CSV/MD dan rute ke editor yang tepat
- 💾 Penyimpanan JSON lokal (`data/transactions.json`)
- 📱 Responsif (desktop, tablet, mobile) + `prefers-reduced-motion`

## 🚀 Menjalankan

```bash
npm install          # install server + client (postinstall otomatis)
npm run build        # build React → client/dist
npm start            # http://localhost:3000
```

Atau satu perintah produksi:

```bash
npm run prod         # build + start
```

**Mode development (hot reload):**

```bash
npm start            # terminal 1 — API di :3000
npm run dev:client   # terminal 2 — Vite di :5173 (proxy /api → :3000)
```

## 📁 Struktur

```
FInance/
├── server.js               # Express: API + export Excel + serve build React
├── package.json
├── data/
│   └── transactions.json   # penyimpanan (dibuat otomatis)
└── client/                 # React + Vite
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx         # router + topbar + dock
        ├── styles.css      # glassmorphism + wave animation
        ├── office.css      # styles Office suite
        ├── api.js
        ├── format.js
        ├── lib/officeUtils.js  # formula engine, HTML→DOCX, download
        ├── hooks/useFinance.jsx
        ├── components/     # Dock, WaveBackground, charts, Toast, Icons
        └── pages/          # Dashboard, Transactions, Reports, Settings,
                            # Office hub, DocEditor, SheetEditor, PdfEditor, MarkdownEditor
```

## 🔌 API

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/transactions` | Semua transaksi + statistik |
| POST | `/api/transactions` | Tambah transaksi |
| PUT | `/api/transactions/:id` | Ubah transaksi |
| DELETE | `/api/transactions/:id` | Hapus transaksi |
| GET | `/api/stats` | Statistik ringkas |
| GET | `/api/export/excel?type=all\|income\|expense&from=YYYY-MM-DD&to=YYYY-MM-DD` | Download Excel |

**Payload:**

```json
{
  "type": "income | expense",
  "amount": 1500000,
  "date": "2026-09-22",
  "category": "Penjualan",
  "description": "Penjualan kopi pagi"
}
```

## 📊 Isi File Excel

1. **Ringkasan** — total pemasukan, total pengeluaran, total profit, jumlah transaksi (format Rp)
2. **Transaksi** — detail: tanggal, jenis, kategori, keterangan, kolom pemasukan/pengeluaran + baris TOTAL + baris TOTAL PROFIT + auto-filter

Filter tanggal & jenis di aplikasi ikut diterapkan ke file yang diunduh.

## ⚙️ Port

```bash
PORT=8080 npm start
```

## 📄 Lisensi

MIT
