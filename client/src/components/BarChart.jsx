/** Grafik batang vertikal sederhana (animasi tumbuh) */
export default function BarChart({ data = [], height = 120, color = '#2563eb' }) {
  if (!data.length || data.every((d) => !d.value)) {
    return (
      <div className="chart-empty" style={{ height }}>
        Belum ada data
      </div>
    );
  }
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="bar-chart" style={{ height }}>
      {data.map((d, i) => {
        const pct = Math.max(4, Math.round((d.value / max) * 100));
        const c = d.color || color;
        return (
          <div className="bar-col" key={i} title={`${d.label}: ${d.display ?? d.value}`}>
            <div
              className="bar-fill"
              style={{
                height: `${pct}%`,
                background: `linear-gradient(180deg, ${c}, ${c}cc)`,
                animationDelay: `${i * 0.06}s`,
              }}
            />
            {d.label && <span className="bar-label">{d.label}</span>}
          </div>
        );
      })}
    </div>
  );
}
