/**
 * Grafik garis area (smooth) dengan animasi gambar — SVG murni.
 * props: data:number[], height?, color?, labels?:string[]
 */
export default function AreaChart({ data = [], height = 160, color = '#2563eb', labels = [] }) {
  if (!data.length || data.every((v) => !v)) {
    return (
      <div className="chart-empty" style={{ height }}>
        Belum ada data untuk ditampilkan
      </div>
    );
  }

  const w = 640;
  const h = height;
  const padX = 6;
  const padY = 12;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;

  const pts = data.map((v, i) => ({
    x: padX + (i * (w - padX * 2)) / Math.max(data.length - 1, 1),
    y: padY + (1 - (v - min) / range) * (h - padY * 2),
  }));

  // Kurva halus (Catmull-Rom → Bézier)
  let d = `M ${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i === 0 ? 0 : i - 1];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2 < pts.length ? i + 2 : pts.length - 1];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`;
  }

  const area = `${d} L ${pts[pts.length - 1].x},${h} L ${pts[0].x},${h} Z`;
  const gid = `area-grad-${color.replace('#', '')}`;

  return (
    <div className="area-chart" style={{ height }}>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="area-svg" role="img" aria-label="Grafik tren">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${gid})`} className="area-fill" />
        <path
          d={d}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          className="area-line"
          vectorEffect="non-scaling-stroke"
        />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="#fff" stroke={color} strokeWidth="2" className="area-dot" style={{ animationDelay: `${0.6 + i * 0.05}s` }} />
        ))}
      </svg>
      {labels.length > 0 && (
        <div className="area-labels">
          {labels.map((l, i) => (
            <span key={i}>{l}</span>
          ))}
        </div>
      )}
    </div>
  );
}
