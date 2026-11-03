import { useId } from 'react';

export function RevenueChart({ values, labels, color = '#6258e8' }: { values: number[]; labels: string[]; color?: string }) {
  const gradient = useId().replace(/:/g, '');
  const max = Math.max(...values, 1);
  const points = values.map((value, index) => {
    const x = 20 + (index * 560) / Math.max(values.length - 1, 1);
    const y = 178 - (value / max) * 145;
    return `${x},${y}`;
  });
  const line = points.map((point, index) => `${index ? 'L' : 'M'} ${point}`).join(' ');
  const area = `${line} L 580,186 L 20,186 Z`;

  return (
    <div className="chart-wrap" role="img" aria-label="Revenue trend chart">
      <svg viewBox="0 0 600 220" preserveAspectRatio="none" className="line-chart">
        <defs>
          <linearGradient id={gradient} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity=".17" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[35, 85, 135, 185].map((y) => <line key={y} x1="20" x2="580" y1={y} y2={y} className="chart-gridline" />)}
        <path d={area} fill={`url(#${gradient})`} />
        <path d={line} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        {points.map((point, index) => {
          const [cx, cy] = point.split(',');
          return <circle key={`${point}-${index}`} cx={cx} cy={cy} r="4" fill="white" stroke={color} strokeWidth="2.5" vectorEffect="non-scaling-stroke" />;
        })}
      </svg>
      <div className="chart-labels">{labels.map((label, index) => <span key={`${label}-${index}`}>{label}</span>)}</div>
    </div>
  );
}

export function CategoryChart({ values, colors, unitLabel = 'items', chartLabel = 'Inventory distribution' }: { values: { label: string; value: number }[]; colors: string[]; unitLabel?: string; chartLabel?: string }) {
  const total = values.reduce((sum, item) => sum + item.value, 0) || 1;
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  return (
    <div className="donut-layout">
      <div className="donut-chart">
        <svg viewBox="0 0 112 112" aria-label={chartLabel} role="img">
          <circle cx="56" cy="56" r={radius} fill="none" stroke="#f0f0f4" strokeWidth="12" />
          {values.map((item, index) => {
            const length = (item.value / total) * circumference;
            const dash = <circle key={item.label} cx="56" cy="56" r={radius} fill="none" stroke={colors[index % colors.length]} strokeWidth="12" strokeDasharray={`${length} ${circumference - length}`} strokeDashoffset={-offset} transform="rotate(-90 56 56)" />;
            offset += length;
            return dash;
          })}
        </svg>
        <div className="donut-center"><strong>{total}</strong><span>{unitLabel}</span></div>
      </div>
      <div className="legend-list">
        {values.map((item, index) => (
          <div className="legend-item" key={item.label}>
            <span className="legend-dot" style={{ backgroundColor: colors[index % colors.length] }} />
            <span className="legend-label">{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MiniBars({ values, labels, colors }: { values: number[]; labels: string[]; colors: string[] }) {
  const max = Math.max(...values, 1);
  return (
    <div className="mini-bars">
      {values.map((value, index) => (
        <div className="mini-bar-row" key={`${labels[index]}-${index}`}>
          <span className="mini-bar-label" title={labels[index]}>{labels[index]}</span>
          <div className="mini-bar-track"><span style={{ width: `${Math.max((value / max) * 100, 2)}%`, background: colors[index % colors.length] }} /></div>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  );
}
