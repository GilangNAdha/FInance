import { useEffect, useMemo, useRef, useState } from 'react';
import { useToast } from '../components/Toast.jsx';
import { downloadBlob, readFileText } from '../lib/officeUtils.js';
import { usePendingFile } from './DocEditor.jsx';

/** Editor Markdown dengan pratinjau live + ekspor HTML/.md */
export default function MarkdownEditor() {
  const showToast = useToast();
  const [title, setTitle] = useState('Catatan Markdown');
  const [text, setText] = useState(
    `# Judul Dokumen\n\nMulai menulis **Markdown** di sini…\n\n- Poin pertama\n- Poin kedua\n\n\`\`\`\nkode / formula\n\`\`\`\n\n| Kolom A | Kolom B |\n|---------|---------|\n| 1       | 2       |\n`
  );
  const fileRef = useRef(null);
  const pendingFile = usePendingFile();

  useEffect(() => {
    if (pendingFile) {
      (async () => {
        try {
          const t = await readFileText(pendingFile);
          setText(t);
          setTitle(pendingFile.name.replace(/\.[^.]+$/, ''));
          showToast('File Markdown/teks dibuka ✓');
        } catch (err) {
          showToast(err.message, 'error');
        }
      })();
    }
  }, [pendingFile, showToast]);

  const html = useMemo(() => mdToHtml(text), [text]);

  function saveMd() {
    downloadBlob(new Blob([text], { type: 'text/markdown;charset=utf-8' }), `${san(title)}.md`);
    showToast('File .md diunduh ✓');
  }

  function saveHtml() {
    const doc = `<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"><title>${title}</title>
<style>body{font-family:Georgia,serif;max-width:760px;margin:2rem auto;padding:0 1rem;line-height:1.7;color:#0f172a}
pre{background:#0f172a;color:#e2e8f0;padding:12px;border-radius:8px;overflow-x:auto}
code{background:#f1f5f9;padding:1px 5px;border-radius:4px;font-size:.9em}
table{border-collapse:collapse}td,th{border:1px solid #cbd5e1;padding:6px 10px}
blockquote{border-left:3px solid #2563eb;margin:1em 0;padding-left:1em;color:#475569}
</style></head><body>${html}</body></html>`;
    downloadBlob(new Blob([doc], { type: 'text/html;charset=utf-8' }), `${san(title)}.html`);
    showToast('File HTML diunduh ✓');
  }

  return (
    <div className="office-shell">
      <div className="editor-head">
        <input
          className="editor-title-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="Judul catatan"
        />
        <div className="editor-actions">
          <button type="button" className="btn btn-glass btn-sm" onClick={() => fileRef.current?.click()}>
            📂 Buka .md
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={saveMd}>
            ⬇ .md
          </button>
          <button type="button" className="btn btn-glass btn-sm" onClick={saveHtml}>
            Ekspor HTML
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          className="tb-fileinput"
          accept=".md,.markdown,.txt"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (f) {
              setText(await readFileText(f));
              setTitle(f.name.replace(/\.[^.]+$/, ''));
              showToast('File dibuka ✓');
            }
            e.target.value = '';
          }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }} className="md-split">
        <div className="glass" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="doc-status" style={{ borderTop: 'none' }}>
            <strong>✍️ Markdown</strong>
            <span>{text.length} karakter</span>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck={false}
            style={{
              width: '100%',
              minHeight: 480,
              border: 'none',
              outline: 'none',
              resize: 'vertical',
              padding: '18px 20px',
              fontSize: '0.88rem',
              lineHeight: 1.65,
              fontFamily: "'SF Mono', 'Fira Code', ui-monospace, monospace",
              background: 'rgba(255,255,255,0.55)',
              color: 'var(--ink)',
            }}
            aria-label="Sumber Markdown"
          />
        </div>
        <div className="glass" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="doc-status" style={{ borderTop: 'none' }}>
            <strong>👁 Pratinjau</strong>
            <span>HTML live</span>
          </div>
          <div
            className="doc-canvas"
            style={{ minHeight: 480, fontFamily: 'inherit', background: '#fff' }}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>
    </div>
  );
}

/* ===== Mini Markdown → HTML (headings, bold, italic, code, lists, tables, links) ===== */
function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function mdToHtml(src) {
  const lines = escapeHtml(src).split('\n');
  const out = [];
  let inCode = false;
  let listType = null; // 'ul' | 'ol'
  let tableBuf = [];

  const flushList = () => {
    if (listType) {
      out.push(`</${listType}>`);
      listType = null;
    }
  };
  const flushTable = () => {
    if (tableBuf.length) {
      const rows = tableBuf;
      tableBuf = [];
      const header = rows[0];
      const body = rows.slice(2);
      out.push('<table><thead><tr>');
      header.forEach((h) => out.push(`<th>${inline(h.trim())}</th>`));
      out.push('</tr></thead><tbody>');
      body.forEach((r) => {
        out.push('<tr>');
        r.forEach((c) => out.push(`<td>${inline(c.trim())}</td>`));
        out.push('</tr>');
      });
      out.push('</tbody></table>');
    }
  };

  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      flushList();
      flushTable();
      if (inCode) {
        out.push('</pre>');
        inCode = false;
      } else {
        out.push('<pre>');
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      out.push(line + '\n');
      continue;
    }

    // table row
    if (/^\s*\|.*\|\s*$/.test(line)) {
      flushList();
      const cells = line.trim().replace(/^\||\|$/g, '').split('|');
      if (/^[\s:|-]+$/.test(line.trim().replace(/^\||\|$/g, '')) && tableBuf.length) {
        // separator row → keep as marker (2nd row)
        tableBuf.push(cells);
      } else {
        tableBuf.push(cells);
      }
      continue;
    } else {
      flushTable();
    }

    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      flushList();
      const lv = Math.min(h[1].length, 6);
      out.push(`<h${lv}>${inline(h[2])}</h${lv}>`);
      continue;
    }
    if (/^\s*([-*_])\s*\1\s*\1\s*[\-*_]*\s*$/.test(line)) {
      flushList();
      out.push('<hr>');
      continue;
    }
    // blockquote (escapeHtml sudah mengubah > menjadi &gt;)
    const bq = /^\s*(?:&gt;|>)\s?(.*)$/.exec(line);
    if (bq) {
      flushList();
      out.push(`<blockquote>${inline(bq[1])}</blockquote>`);
      continue;
    }
    const ul = /^\s*[-*+]\s+(.*)$/.exec(line);
    if (ul) {
      if (listType !== 'ul') {
        flushList();
        out.push('<ul>');
        listType = 'ul';
      }
      out.push(`<li>${inline(ul[1])}</li>`);
      continue;
    }
    const ol = /^\s*\d+\.\s+(.*)$/.exec(line);
    if (ol) {
      if (listType !== 'ol') {
        flushList();
        out.push('<ol>');
        listType = 'ol';
      }
      out.push(`<li>${inline(ol[1])}</li>`);
      continue;
    }
    if (line.trim() === '') {
      flushList();
      continue;
    }
    flushList();
    out.push(`<p>${inline(line)}</p>`);
  }
  flushList();
  flushTable();
  if (inCode) out.push('</pre>');
  return out.join('\n');
}

function inline(s) {
  return s
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/~~([^~]+)~~/g, '<del>$1</del>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
}

function san(s) {
  return (s || 'catatan').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-') || 'catatan';
}
