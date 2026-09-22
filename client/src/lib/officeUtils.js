/* ===== Office suite utils: download, HTML→DOCX, formula engine ===== */

/** Trigger download blob */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** Muat File sebagai ArrayBuffer */
export const readFileBuffer = (file) => file.arrayBuffer();

/** Muat File sebagai teks */
export async function readFileText(file) {
  return file.text();
}

/* ============ DOCX export (via paket `docx`) ============ */
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  LevelFormat,
} from 'docx';

function inlineRuns(node) {
  const runs = [];
  for (const child of node.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) {
      if (child.textContent) runs.push(new TextRun({ text: child.textContent }));
      continue;
    }
    if (child.nodeType !== Node.ELEMENT_NODE) continue;
    const tag = child.tagName.toUpperCase();
    const inner = inlineRuns(child);
    if (tag === 'BR') {
      runs.push(new TextRun({ break: 1 }));
    } else if (tag === 'B' || tag === 'STRONG') {
      runs.push(...inner.map((r) => patchRun(r, { bold: true })));
    } else if (tag === 'I' || tag === 'EM') {
      runs.push(...inner.map((r) => patchRun(r, { italics: true })));
    } else if (tag === 'U') {
      runs.push(...inner.map((r) => patchRun(r, { underline: {} })));
    } else if (tag === 'SPAN') {
      const color = child.style?.color;
      runs.push(
        ...inner.map((r) => patchRun(r, color ? { color: cssColorToHex(color) } : {}))
      );
    } else {
      runs.push(...inner);
    }
  }
  return runs;
}

function patchRun(run, props) {
  // TextRun tidak mudah di-merge; buat ulang dari options publik bila ada
  try {
    const opts = { ...run.options, ...props };
    return new TextRun(opts);
  } catch {
    return new TextRun(props);
  }
}

function cssColorToHex(color) {
  const m = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/.exec(color);
  if (!m) return '000000';
  return m.slice(1).map((n) => Number(n).toString(16).padStart(2, '0')).join('');
}

/** Konversi HTML string → blob .docx */
export async function htmlToDocxBlob(html, title = 'Dokumen') {
  const parser = new DOMParser();
  const docHtml = parser.parseFromString(html, 'text/html');
  const body = docHtml.body;
  const children = [];

  const walk = (node, listLevel = 0) => {
    for (const child of node.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        const t = child.textContent.trim();
        if (t) list.push(new Paragraph({ children: [new TextRun(t)] }));
        continue;
      }
      if (child.nodeType !== Node.ELEMENT_NODE) continue;
      const tag = child.tagName.toUpperCase();

      if (/^H[1-3]$/.test(tag)) {
        const level = Number(tag[1]) - 1;
        children.push(
          new Paragraph({
            children: inlineRuns(child),
            heading: [HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3][level],
            spacing: { before: 240, after: 120 },
          })
        );
      } else if (tag === 'P' || tag === 'DIV') {
        const runs = inlineRuns(child);
        children.push(new Paragraph({ children: runs.length ? runs : [new TextRun('')] }));
      } else if (tag === 'UL' || tag === 'OL') {
        walkList(child, tag === 'OL' ? LevelFormat.DECIMAL : LevelFormat.BULLET, listLevel);
      } else if (tag === 'TABLE') {
        // Sederhana: ekstrak teks sel sebagai paragraf bertingkat
        child.querySelectorAll('tr').forEach((tr) => {
          const cells = [...tr.querySelectorAll('td,th')].map(
            (td) => td.textContent.trim()
          );
          children.push(new Paragraph({ children: [new TextRun(cells.join('  |  '))] }));
        });
      } else if (tag === 'HR') {
        children.push(new Paragraph({ text: '', border: { bottom: {} } }));
      } else if (tag === 'BLOCKQUOTE') {
        const runs = inlineRuns(child).map((r) => patchRun(r, { italics: true, color: '555555' }));
        children.push(new Paragraph({ children: runs, indent: { left: 720 } }));
      } else if (tag === 'PRE' || tag === 'CODE') {
        child.textContent.split('\n').forEach((line) => {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: line, font: 'Courier New' })],
            })
          );
        });
      } else if (/^(UL|OL)$/.test(tag)) {
        walkList(child, LevelFormat.BULLET, listLevel);
      } else {
        walk(child, listLevel);
      }
    }
  };

  const walkList = (listEl, format, level) => {
    [...listEl.children].forEach((li) => {
      if (li.tagName !== 'LI') return;
      const runs = [];
      // ambil teks langsung & inline children
      const clone = li.cloneNode(true);
      clone.querySelectorAll('ul,ol').forEach((n) => n.remove());
      const txt = clone.textContent.trim();
      if (txt) runs.push(new TextRun(txt));
      children.push(
        new Paragraph({
          children: runs,
          numbering: { reference: format === LevelFormat.DECIMAL ? 'num-list' : 'bullet-list', level: Math.min(level, 2) },
        })
      );
      li.querySelectorAll(':scope > ul, :scope > ol').forEach((sub) => {
        walkList(sub, sub.tagName === 'OL' ? LevelFormat.DECIMAL : LevelFormat.BULLET, level + 1);
      });
    });
  };

  walk(body);

  const doc = new Document({
    title,
    numbering: {
      config: [
        {
          reference: 'bullet-list',
          levels: [
            { level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT },
            { level: 1, format: LevelFormat.BULLET, text: '◦', alignment: AlignmentType.LEFT },
            { level: 2, format: LevelFormat.BULLET, text: '▪', alignment: AlignmentType.LEFT },
          ],
        },
        {
          reference: 'num-list',
          levels: [
            { level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT },
            { level: 1, format: LevelFormat.LOWER_LETTER, text: '%2.', alignment: AlignmentType.LEFT },
          ],
        },
      ],
    },
    sections: [{ children }],
  });

  return Packer.toBlob(doc);
}

/* ============ Formula engine (spreadsheet) ============ */

export function colToIndex(col) {
  let n = 0;
  for (const ch of col) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

export function indexToCol(idx) {
  let n = idx + 1;
  let s = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

export function cellName(r, c) {
  return `${indexToCol(c)}${r + 1}`;
}

const FUNCS = {
  SUM: (arr) => arr.reduce((a, b) => a + (Number(b) || 0), 0),
  AVERAGE: (arr) => {
    const nums = arr.map(Number).filter((n) => !Number.isNaN(n));
    return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
  },
  AVG: null, // alias
  MIN: (arr) => Math.min(...arr.map(Number).filter((n) => !Number.isNaN(n))),
  MAX: (arr) => Math.max(...arr.map(Number).filter((n) => !Number.isNaN(n))),
  COUNT: (arr) => arr.filter((v) => v !== '' && !Number.isNaN(Number(v))).length,
  ROUND: (arr) => {
    const v = Number(arr[0]) || 0;
    const d = Number(arr[1]) || 0;
    const f = 10 ** d;
    return Math.round(v * f) / f;
  },
  ABS: (arr) => Math.abs(Number(arr[0]) || 0),
};
FUNCS.AVG = FUNCS.AVERAGE;

/**
 * Evaluasi formula sheet.
 * @param {string[][]} raw matrix nilai mentah ("" | angka | "=...")
 * @returns {string[][]} matrix nilai tampilan
 */
export function evaluateSheet(raw) {
  const rows = raw.length;
  const cols = raw[0]?.length || 0;
  const memo = Array.from({ length: rows }, () => Array(cols).fill(undefined));
  const visiting = new Set();

  const rawAt = (r, c) => (raw[r]?.[c] ?? '').toString();
  const displayAt = (r, c) => {
    if (r < 0 || c < 0 || r >= rows || c >= cols) return 0;
    const v = memo[r][c];
    if (v !== undefined) return v;
    if (visiting.has(`${r},${c}`)) return '#LOOP!';
    visiting.add(`${r},${c}`);
    const out = compute(r, c);
    visiting.delete(`${r},${c}`);
    memo[r][c] = out;
    return out;
  };

  const compute = (r, c) => {
    const rawVal = rawAt(r, c);
    if (rawVal === '') return '';
    if (!rawVal.startsWith('=')) {
      // angka?
      const n = Number(rawVal);
      return Number.isFinite(n) && rawVal.trim() !== '' ? String(n) : rawVal;
    }
    try {
      const result = evalExpr(rawVal.slice(1), displayAt);
      if (result === null || result === undefined || Number.isNaN(result)) return '#ERROR';
      if (typeof result === 'number') {
        return Number.isInteger(result) ? String(result) : String(Math.round(result * 1e10) / 1e10);
      }
      return String(result);
    } catch (e) {
      if (String(e.message).includes('LOOP')) return '#LOOP!';
      return '#ERROR';
    }
  };

  const out = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) row.push(displayAt(r, c) === undefined ? '' : String(displayAt(r, c)));
    out.push(row);
  }
  return out;
}

function expandRange(name, displayAt) {
  const m = /^([A-Z]+)(\d+):([A-Z]+)(\d+)$/.exec(name);
  if (!m) return null;
  const c1 = colToIndex(m[1]);
  const r1 = Number(m[2]) - 1;
  const c2 = colToIndex(m[3]);
  const r2 = Number(m[4]) - 1;
  const vals = [];
  const rMin = Math.min(r1, r2);
  const rMax = Math.max(r1, r2);
  const cMin = Math.min(c1, c2);
  const cMax = Math.max(c1, c2);
  for (let r = rMin; r <= rMax; r++) {
    for (let c = cMin; c <= cMax; c++) vals.push(displayAt(r, c));
  }
  return vals;
}

function evalExpr(expr, displayAt) {
  // 1) Ekspansi fungsi dari dalam ke luar (dukung fungsi bersarang + range)
  let e = expr;
  let guard = 0;
  while (guard++ < 50) {
    const idx = findInnerFuncCall(e);
    if (idx === null) break;
    const { name, args, start, end } = idx;
    const F = FUNCS[name.toUpperCase()];
    if (!F) throw new Error('Unknown fn');
    const parts = splitArgs(args);
    const values = [];
    for (const p of parts) {
      const trimmed = p.trim();
      if (/^[A-Z]+\d+:[A-Z]+\d+$/i.test(trimmed)) {
        values.push(...(expandRange(trimmed.toUpperCase(), displayAt) ?? []));
      } else {
        values.push(evalExpr(trimmed, displayAt));
      }
    }
    const res = F(values);
    const literal = typeof res === 'number' ? String(res) : JSON.stringify(res);
    // Ganti dari akhir ke awal agar indeks tetap valid
    e = e.slice(0, start) + literal + e.slice(end);
  }

  // 2) Referensi sel → nilai (error sel diteruskan)
  e = e.replace(/\$?([A-Z]+)\$?(\d+)\b/gi, (_, col, row) => {
    const v = displayAt(Number(row) - 1, colToIndex(col.toUpperCase()));
    if (typeof v === 'string' && v.startsWith('#')) throw new Error(v);
    const n = Number(v);
    return Number.isFinite(n) && v !== '' ? String(n) : '0';
  });

  // 3) Operator aman (persen: dukung multi-digit & desimal)
  e = e.replace(/\^/g, '**').replace(/(\d+(?:\.\d+)?)\s*%/g, '($1/100)');

  // 4) Validasi karakter (boleh angka, operator, titik, spasi)
  if (!/^[-+*/().,\s0-9]+$/.test(e)) throw new Error('Invalid');

  // 5) Eval matematika saja
  // eslint-disable-next-line no-new-func
  return Function(`"use strict"; return (${e});`)();
}

/**
 * Cari pemanggilan fungsi bersarang terdalam: NAMA(args) dengan args tanpa kurung terbuka.
 * Mengembalikan indeks posisi agar bisa diganti berulang dari dalam ke luar.
 */
function findInnerFuncCall(s) {
  const re = /([A-Z]+)\((([^()]*))\)/gi;
  let m;
  let found = null;
  while ((m = re.exec(s)) !== null) {
    found = { name: m[1], args: m[3], start: m.index, end: m.index + m[0].length };
    // teruskan cari yang lebih kecil/lebih dalam (loop tetap — semua non-nested akan ketemu)
  }
  return found;
}

function splitArgs(s) {
  const out = [];
  let depth = 0;
  let cur = '';
  for (const ch of s) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) {
      out.push(cur);
      cur = '';
    } else cur += ch;
  }
  if (cur.trim()) out.push(cur);
  return out;
}

/* ============ Grid helpers ============ */

export function emptyGrid(rows, cols) {
  return Array.from({ length: rows }, () => Array(cols).fill(''));
}

export function aoaToGrid(aoa, rows, cols) {
  const grid = emptyGrid(rows, cols);
  aoa.forEach((row, r) => {
    if (r >= rows) return;
    row.forEach((val, c) => {
      if (c >= cols) return;
      if (val === null || val === undefined) return;
      // pertahankan formula bila ada
      grid[r][c] = String(val);
    });
  });
  return grid;
}
