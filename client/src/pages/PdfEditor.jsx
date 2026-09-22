import { useCallback, useEffect, useRef, useState } from 'react';
import { useToast } from '../components/Toast.jsx';
import { downloadBlob } from '../lib/officeUtils.js';
import { usePendingFile } from './DocEditor.jsx';

/**
 * Editor PDF — pratinjau (pdf.js) + gabung & rotasi (pdf-lib).
 * Semua diproses lokal di browser.
 */
export default function PdfEditor() {
  const showToast = useToast();
  const [files, setFiles] = useState([]); // {id, name, arrayBuffer, blob}
  const [activeId, setActiveId] = useState(null);
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.15);
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const pendingFile = usePendingFile();

  const active = files.find((f) => f.id === activeId) || null;

  const addFiles = useCallback(
    async (fileList) => {
      const added = [];
      for (const file of Array.from(fileList)) {
        const ext = (file.name.split('.').pop() || '').toLowerCase();
        if (ext !== 'pdf') {
          showToast(`"${file.name}" bukan PDF — dilewati`, 'error');
          continue;
        }
        const buf = await file.arrayBuffer();
        const item = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: file.name,
          buffer: buf,
        };
        added.push(item);
      }
      if (!added.length) return;
      setFiles((prev) => [...prev, ...added]);
      setActiveId((cur) => cur || added[0].id);
      showToast(`${added.length} file PDF ditambahkan ✓`);
    },
    [showToast]
  );

  useEffect(() => {
    if (pendingFile) addFiles([pendingFile]);
  }, [pendingFile, addFiles]);

  /* Render halaman dengan pdf.js */
  const renderPage = useCallback(async () => {
    if (!active) return;
    setLoading(true);
    try {
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url
      ).toString();

      // Salin buffer karena getDocument mengonsumsi/transfer data
      const task = pdfjs.getDocument({ data: active.buffer.slice(0) });
      const pdf = await task.promise;
      setNumPages(pdf.numPages);
      const p = Math.min(pageNum, pdf.numPages);
      const page = await pdf.getPage(p);
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: ctx, viewport }).promise;
    } catch (err) {
      console.error(err);
      showToast(`Gagal render PDF: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [active, pageNum, scale, showToast]);

  useEffect(() => {
    setPageNum(1);
    setNumPages(0);
  }, [activeId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (cancelled) return;
      await renderPage();
    })();
    return () => {
      cancelled = true;
    };
  }, [renderPage]);

  function removeFile(id) {
    setFiles((prev) => {
      const next = prev.filter((f) => f.id !== id);
      if (activeId === id) setActiveId(next[0]?.id ?? null);
      return next;
    });
  }

  /* Unduh file aktif apa adanya */
  function downloadActive() {
    if (!active) return;
    downloadBlob(new Blob([active.buffer], { type: 'application/pdf' }), active.name);
    showToast('PDF diunduh ✓');
  }

  /* Rotasi semua halaman 90° (pdf-lib) */
  async function rotateActive() {
    if (!active) return;
    try {
      setLoading(true);
      const { PDFDocument, degrees } = await import('pdf-lib');
      const doc = await PDFDocument.load(active.buffer.slice(0));
      doc.getPages().forEach((p) => p.setRotation(degrees((p.getRotation().angle + 90) % 360)));
      const bytes = await doc.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      downloadBlob(blob, active.name.replace(/\.pdf$/i, '') + '-rotated.pdf');
      showToast('Rotasi 90° — file baru diunduh ✓');
    } catch (err) {
      console.error(err);
      showToast(`Gagal rotasi: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }

  /* Gabung semua file PDF → 1 */
  async function mergeAll() {
    if (files.length < 2) {
      showToast('Butuh minimal 2 file PDF untuk digabung', 'error');
      return;
    }
    try {
      setLoading(true);
      const { PDFDocument } = await import('pdf-lib');
      const merged = await PDFDocument.create();
      for (const f of files) {
        const src = await PDFDocument.load(f.buffer.slice(0));
        const pages = await merged.copyPages(src, src.getPageIndices());
        pages.forEach((p) => merged.addPage(p));
      }
      const bytes = await merged.save();
      downloadBlob(
        new Blob([bytes], { type: 'application/pdf' }),
        `gabungan-${files.length}-pdf.pdf`
      );
      showToast(`${files.length} PDF digabung ✓`);
    } catch (err) {
      console.error(err);
      showToast(`Gagal menggabung: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="office-shell">
      <div className="editor-head">
        <input
          className="editor-title-input"
          value={active ? active.name : 'Editor PDF'}
          readOnly
          aria-label="Nama file PDF"
        />
        <div className="editor-actions">
          <button type="button" className="btn btn-glass btn-sm" onClick={() => fileInputRef.current?.click()}>
            📂 Tambah PDF
          </button>
          <button type="button" className="btn btn-glass btn-sm" onClick={rotateActive} disabled={!active}>
            ↻ Rotasi 90°
          </button>
          <button
            type="button"
            className="btn btn-glass btn-sm"
            onClick={mergeAll}
            disabled={files.length < 2}
          >
            ⧉ Gabung ({files.length})
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={downloadActive} disabled={!active}>
            ⬇ Unduh
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          className="tb-fileinput"
          accept=".pdf,application/pdf"
          multiple
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      <div className="pdf-layout">
        {/* Daftar file */}
        <aside className="glass pdf-sidebar">
          <strong style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)' }}>
            File ({files.length})
          </strong>
          {files.length === 0 && (
            <p className="muted" style={{ fontSize: '0.8rem' }}>
              Belum ada PDF. Tambahkan file atau jatuhkan dari halaman Office.
            </p>
          )}
          {files.map((f) => (
            <div
              key={f.id}
              className={`pdf-file-item${f.id === activeId ? ' active' : ''}`}
              onClick={() => setActiveId(f.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setActiveId(f.id)}
            >
              <span className="pf-ico">PDF</span>
              <span className="pf-name" title={f.name}>
                {f.name}
              </span>
              <button
                type="button"
                className="pf-remove"
                title="Hapus dari daftar"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(f.id);
                }}
              >
                ×
              </button>
            </div>
          ))}
        </aside>

        {/* Stage */}
        <section className="glass pdf-stage">
          {!active ? (
            <div className="pdf-empty">
              <div className="big">📕</div>
              <strong>Belum ada PDF terbuka</strong>
              <p className="muted">Klik “Tambah PDF” untuk memilih file dari perangkat Anda.</p>
              <button type="button" className="btn btn-primary" onClick={() => fileInputRef.current?.click()}>
                Tambah PDF
              </button>
            </div>
          ) : (
            <>
              <div className="pdf-page-nav">
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setPageNum((p) => Math.max(1, p - 1))}
                  disabled={pageNum <= 1}
                  aria-label="Halaman sebelumnya"
                >
                  ‹
                </button>
                <span>
                  Halaman {pageNum} / {numPages || '?'}
                </span>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setPageNum((p) => Math.min(numPages, p + 1))}
                  disabled={pageNum >= numPages}
                  aria-label="Halaman berikutnya"
                >
                  ›
                </button>
                <span className="tb-sep" />
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setScale((s) => Math.max(0.5, +(s - 0.15).toFixed(2)))}
                  aria-label="Perkecil"
                >
                  −
                </button>
                <span>{Math.round(scale * 100)}%</span>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setScale((s) => Math.min(3, +(s + 0.15).toFixed(2)))}
                  aria-label="Perbesar"
                >
                  +
                </button>
              </div>
              <div className="pdf-canvas-frame">
                <canvas ref={canvasRef} />
              </div>
              {loading && <p className="muted" style={{ fontSize: '0.8rem' }}>Memuat…</p>}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
