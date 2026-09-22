import { useCallback, useEffect, useRef, useState } from 'react';
import { useToast } from '../components/Toast.jsx';
import { downloadBlob, htmlToDocxBlob, readFileBuffer, readFileText } from '../lib/officeUtils.js';

/** Ambil file yang dipilih di halaman Office (sessionStorage) */
export function usePendingFile() {
  const [pending, setPending] = useState(null);

  useEffect(() => {
    try {
      const metaRaw = sessionStorage.getItem('office-pending-file-meta');
      const dataRaw = sessionStorage.getItem('office-pending-file');
      if (metaRaw) {
        const meta = JSON.parse(metaRaw);
        if (dataRaw) {
          // data URL → blob saat dibutuhkan
          fetch(dataRaw)
            .then((r) => r.blob())
            .then((blob) => {
              const file = new File([blob], meta.name, {
                type: meta.type,
                lastModified: meta.lastModified,
              });
              setPending(file);
              sessionStorage.removeItem('office-pending-file');
              sessionStorage.removeItem('office-pending-file-meta');
            })
            .catch(() => setPending({ ...meta, __dataUrl: dataRaw }));
        } else {
          setPending(meta);
          sessionStorage.removeItem('office-pending-file-meta');
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  return pending;
}

const exec = (cmd, val = null) => document.execCommand(cmd, false, val);

export default function DocEditor() {
  const showToast = useToast();
  const canvasRef = useRef(null);
  const fileRef = useRef(null);
  const [title, setTitle] = useState('Dokumen Tanpa Judul');
  const [stats, setStats] = useState({ words: 0, chars: 0, paras: 0 });
  const [activeMarks, setActiveMarks] = useState({});
  const pendingFile = usePendingFile();

  const refreshStats = useCallback(() => {
    const el = canvasRef.current;
    if (!el) return;
    const text = el.innerText || '';
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const paras = el.querySelectorAll('p, h1, h2, h3, li, div').length || (text.trim() ? 1 : 0);
    setStats({ words, chars: text.length, paras });
  }, []);

  const refreshMarks = useCallback(() => {
    const marks = {};
    for (const cmd of ['bold', 'italic', 'underline', 'strikeThrough', 'insertUnorderedList', 'insertOrderedList']) {
      try {
        marks[cmd] = document.queryCommandState(cmd);
      } catch {
        marks[cmd] = false;
      }
    }
    setActiveMarks(marks);
  }, []);

  /* Muat file pending → editor */
  const loadFileInto = useCallback(
    async (file) => {
      if (!file) return;
      const ext = (file.name.split('.').pop() || '').toLowerCase();
      const base = file.name.replace(/\.[^.]+$/, '');
      setTitle(base || 'Dokumen');
      try {
        if (ext === 'docx') {
          const mammoth = await import('mammoth/mammoth.browser');
          const buf = await readFileBuffer(file);
          const result = await mammoth.convertToHtml({ arrayBuffer: buf });
          canvasRef.current.innerHTML = result.value || '<p></p>';
          if (result.messages?.length) {
            showToast(`DOCX dibuka (${result.messages.length} catatan konversi)`);
          } else {
            showToast('DOCX dibuka ✓');
          }
        } else if (ext === 'html' || ext === 'htm' || ext === 'rtf') {
          const text = await readFileText(file);
          if (ext === 'rtf') {
            canvasRef.current.innerText = text.slice(0, 20000);
            showToast('RTF dibuka sebagai teks (format terbatas)');
          } else {
            const doc = new DOMParser().parseFromString(text, 'text/html');
            canvasRef.current.innerHTML = doc.body.innerHTML || '<p></p>';
            showToast('HTML dibuka ✓');
          }
        } else {
          const text = await readFileText(file);
          canvasRef.current.innerHTML = text
            .split(/\n{2,}/)
            .map((p) => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
            .join('');
          showToast('File teks dibuka ✓');
        }
        refreshStats();
      } catch (err) {
        console.error(err);
        // .doc biner lama tidak didukung mammoth
        if (ext === 'doc') {
          showToast('Format .doc lama tidak didukung — silakan simpan ulang sebagai .docx', 'error');
        } else {
          showToast(`Gagal membuka file: ${err.message}`, 'error');
        }
      }
    },
    [showToast, refreshStats]
  );

  useEffect(() => {
    if (pendingFile) loadFileInto(pendingFile);
  }, [pendingFile, loadFileInto]);

  /* Simpan ke .docx */
  async function saveDocx() {
    try {
      const html = canvasRef.current?.innerHTML || '';
      const blob = await htmlToDocxBlob(html, title);
      downloadBlob(blob, `${sanitizeName(title)}.docx`);
      showToast('File .docx diunduh ✓');
    } catch (err) {
      console.error(err);
      showToast('Gagal membuat .docx', 'error');
    }
  }

  /* Simpan HTML */
  function saveHtml() {
    const html = `<!DOCTYPE html>
<html lang="id"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<style>body{font-family:Georgia,serif;max-width:800px;margin:2rem auto;padding:0 1rem;line-height:1.7;color:#1e293b}</style>
</head><body>${canvasRef.current?.innerHTML || ''}</body></html>`;
    downloadBlob(new Blob([html], { type: 'text/html;charset=utf-8' }), `${sanitizeName(title)}.html`);
    showToast('File HTML diunduh ✓');
  }

  /* Cetak → PDF */
  function printPdf() {
    const content = canvasRef.current?.innerHTML || '';
    const win = window.open('', '_blank');
    if (!win) {
      showToast('Popup diblokir — izinkan popup untuk mencetak', 'error');
      return;
    }
    win.document.write(`<!DOCTYPE html><html><head><title>${escapeHtml(title)}</title>
<style>
body{font-family:Georgia,serif;max-width:800px;margin:2.5rem auto;padding:0 1.5rem;line-height:1.7;color:#0f172a}
h1{font-size:1.8rem}h2{font-size:1.4rem}h3{font-size:1.15rem}
table{border-collapse:collapse;width:100%}td,th{border:1px solid #94a3b8;padding:6px 9px;font-size:.9em}
blockquote{border-left:3px solid #2563eb;padding-left:1em;color:#475569;font-style:italic}
pre{background:#0f172a;color:#e2e8f0;padding:10px;border-radius:8px;overflow-x:auto}
@media print{body{margin:0}}
</style></head><body>${content}</body></html>`);
    win.document.close();
    setTimeout(() => {
      win.focus();
      win.print();
    }, 350);
    showToast('Dialog cetak dibuka — pilih "Simpan sebagai PDF"');
  }

  /* Toolbar actions */
  const cmd = (command, value = null) => {
    canvasRef.current?.focus();
    exec(command, value);
    refreshMarks();
    refreshStats();
  };

  const onInput = () => {
    refreshStats();
  };

  function newDoc() {
    if (canvasRef.current) canvasRef.current.innerHTML = '';
    setTitle('Dokumen Tanpa Judul');
    refreshStats();
    showToast('Dokumen baru');
  }

  return (
    <div className="office-shell">
      {/* Header */}
      <div className="editor-head">
        <input
          className="editor-title-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="Judul dokumen"
        />
        <div className="editor-actions">
          <button type="button" className="btn btn-glass btn-sm" onClick={newDoc}>
            📄 Baru
          </button>
          <button type="button" className="btn btn-glass btn-sm" onClick={() => fileRef.current?.click()}>
            📂 Buka
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={saveDocx}>
            ⬇ Unduh .docx
          </button>
          <button type="button" className="btn btn-glass btn-sm" onClick={saveHtml}>
            Unduh HTML
          </button>
          <button type="button" className="btn btn-glass btn-sm" onClick={printPdf}>
            🖨 Cetak / PDF
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          className="tb-fileinput"
          accept=".doc,.docx,.rtf,.html,.htm,.txt"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) loadFileInto(f);
            e.target.value = '';
          }}
        />
      </div>

      {/* Toolbar */}
      <div className="editor-toolbar" role="toolbar" aria-label="Formatting">
        <select
          className="tb-select"
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) cmd('formatBlock', e.target.value);
            e.target.value = '';
          }}
          aria-label="Gaya paragraf"
        >
          <option value="" disabled>
            Paragraph
          </option>
          <option value="p">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="blockquote">Quote</option>
          <option value="pre">Code</option>
        </select>
        <span className="tb-sep" />
        <button type="button" className={`tb-btn${activeMarks.bold ? ' active' : ''}`} onClick={() => cmd('bold')} title="Bold (B)">
          <b>B</b>
        </button>
        <button type="button" className={`tb-btn${activeMarks.italic ? ' active' : ''}`} onClick={() => cmd('italic')} title="Italic (I)">
          <i>I</i>
        </button>
        <button type="button" className={`tb-btn${activeMarks.underline ? ' active' : ''}`} onClick={() => cmd('underline')} title="Underline (U)">
          <u>U</u>
        </button>
        <button type="button" className={`tb-btn${activeMarks.strikeThrough ? ' active' : ''}`} onClick={() => cmd('strikeThrough')} title="Strikethrough">
          <s>S</s>
        </button>
        <span className="tb-sep" />
        <button type="button" className={`tb-btn${activeMarks.insertUnorderedList ? ' active' : ''}`} onClick={() => cmd('insertUnorderedList')} title="Bullet list">
          •≡
        </button>
        <button type="button" className={`tb-btn${activeMarks.insertOrderedList ? ' active' : ''}`} onClick={() => cmd('insertOrderedList')} title="Numbered list">
          1≡
        </button>
        <span className="tb-sep" />
        <button type="button" className="tb-btn" onClick={() => cmd('justifyLeft')} title="Rata kiri">
          ≡←
        </button>
        <button type="button" className="tb-btn" onClick={() => cmd('justifyCenter')} title="Rata tengah">
          ≡↔
        </button>
        <button type="button" className="tb-btn" onClick={() => cmd('justifyRight')} title="Rata kanan">
          →≡
        </button>
        <span className="tb-sep" />
        <button type="button" className="tb-btn" onClick={() => insertHtml('<hr>')} title="Garis horizontal">
          ―
        </button>
        <button
          type="button"
          className="tb-btn"
          title="Sisipkan tabel 3×3"
          onClick={() =>
            insertHtml(
              '<table><tbody>' +
                Array(3)
                  .fill(
                    '<tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>'
                  )
                  .join('') +
                '</tbody></table><p><br></p>'
            )
          }
        >
          ⊞
        </button>
        <button
          type="button"
          className="tb-btn"
          title="Tautan"
          onClick={() => {
            const url = window.prompt('URL tautan:', 'https://');
            if (url) cmd('createLink', url);
          }}
        >
          🔗
        </button>
        <span className="tb-sep" />
        <button type="button" className="tb-btn" onClick={() => cmd('undo')} title="Undo">
          ↺
        </button>
        <button type="button" className="tb-btn" onClick={() => cmd('redo')} title="Redo">
          ↻
        </button>
        <button type="button" className="tb-btn" onClick={() => cmd('removeFormat')} title="Bersihkan format">
          ⌫A
        </button>
        <span style={{ flex: 1 }} />
        <span className="muted" style={{ fontSize: '0.72rem', fontWeight: 700 }}>
          {stats.words} kata · {stats.chars} karakter
        </span>
      </div>

      {/* Canvas dokumen */}
      <div className="doc-canvas-wrap">
        <div
          ref={canvasRef}
          className="doc-canvas"
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-label="Isi dokumen"
          data-placeholder="Mulai menulis dokumen Anda di sini…"
          onInput={onInput}
          onKeyUp={refreshMarks}
          onMouseUp={refreshMarks}
          onBlur={refreshStats}
        />
        <div className="doc-status">
          <span>
            📄 {title}.docx · {stats.paras} blok
          </span>
          <span>Ekspor: .docx · HTML · Cetak ke PDF</span>
        </div>
      </div>
    </div>
  );
}

function insertHtml(html) {
  canvasFocus();
  document.execCommand('insertHTML', false, html);
}

function canvasFocus() {
  const el = document.querySelector('.doc-canvas');
  el?.focus();
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function sanitizeName(s) {
  return (s || 'dokumen').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-') || 'dokumen';
}
