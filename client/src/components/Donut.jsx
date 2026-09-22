/** Donut chart (rasio) — SVG murni */
export default function Donut({
  value = 0,
  total = 100,
  size = 150,
  strokeWidth = 14,
  color = '#2563eb',
  trackColor = 'rgba(148, 163, 184, 0.25)',
  label = '',
  sublabel = '',
}) {
  const pct = total > 0 ? Math.min(100, Math.max(0, (value / total) * 100)) : 0;
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;

  return (
    <div className="donut" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label || 'Donut chart'}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          strokeDashoffset={c * 0.25}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="donut-arc"
        />
      </svg>
      <div className="donut-center">
        <strong>{label}</strong>
        {sublabel && <span>{sublabel}</span>}
      </div>
    </div>
  );
}
