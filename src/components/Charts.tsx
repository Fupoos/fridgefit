/**
 * Small hand-written charts. One hue (basil) throughout: magnitude is shown by
 * length or lightness, never by a rainbow. Every value is also printed as text.
 */

const fmt = (v: number, dp = 0) => v.toLocaleString('en-AU', { maximumFractionDigits: dp, minimumFractionDigits: dp })

export function MacroBars({ rows }: { rows: { label: string; value: number; target: number; unit: string }[] }) {
  return (
    <div className="bar-list">
      {rows.map((r) => {
        const max = Math.max(r.target * 1.25, r.value)
        return (
          <div className="bar-item" key={r.label}>
            <span>{r.label}</span>
            <span className="val">
              {fmt(r.value)} of {fmt(r.target)} {r.unit}
            </span>
            <div className="track" role="img" aria-label={`${r.label}: ${fmt(r.value)} of ${fmt(r.target)} ${r.unit}`}>
              <div className="fill" style={{ width: `${(r.value / max) * 100}%` }} />
              <div className="target-tick" style={{ left: `${(r.target / max) * 100}%` }} title={`Target ${fmt(r.target)} ${r.unit}`} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function ProbBars({ rows, highlight }: { rows: { label: string; p: number }[]; highlight: string }) {
  return (
    <div className="bar-list">
      {rows.map((r) => (
        <div className="bar-item" key={r.label}>
          <span style={{ fontWeight: r.label === highlight ? 700 : 400 }}>{r.label}</span>
          <span className="val">{fmt(r.p * 100)}%</span>
          <div className="track" role="img" aria-label={`${r.label}: ${fmt(r.p * 100)}%`}>
            <div
              className="fill"
              style={{ width: `${r.p * 100}%`, background: r.label === highlight ? 'var(--basil-600)' : 'var(--basil-300)' }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Signed horizontal bars around a zero line: direction carries the sign. */
export function SignedBars({ rows, caption }: { rows: { label: string; value: number }[]; caption: string }) {
  const rowH = 30
  const labelW = 150
  const width = 340
  const plotW = width - labelW - 44
  const max = Math.max(...rows.map((r) => Math.abs(r.value)), 1e-9)
  const zero = labelW + plotW / 2
  const height = rows.length * rowH + 22
  return (
    <figure style={{ margin: 0 }}>
      <svg className="chart" viewBox={`0 0 ${width} ${height}`} width="100%" role="img" aria-label={caption}>
        <line x1={zero} x2={zero} y1={0} y2={rows.length * rowH} stroke="var(--shelf-strong)" strokeWidth={1} />
        {rows.map((r, i) => {
          const w = (Math.abs(r.value) / max) * (plotW / 2)
          const y = i * rowH + 8
          const x = r.value >= 0 ? zero + 1 : zero - 1 - w
          return (
            <g key={r.label}>
              <title>{`${r.label}: ${r.value >= 0 ? '+' : ''}${fmt(r.value, 2)}`}</title>
              <rect x={0} y={i * rowH} width={width} height={rowH} fill="transparent" />
              <text x={0} y={y + 10} fontSize={12.5} fill="var(--ink-2)">
                {r.label}
              </text>
              <rect x={x} y={y} width={Math.max(w, 1)} height={12} rx={4} fill="var(--basil-500)" />
              <text
                x={r.value >= 0 ? zero + w + 6 : zero - w - 6}
                y={y + 10}
                fontSize={11.5}
                textAnchor={r.value >= 0 ? 'start' : 'end'}
                fill="var(--ink-3)"
              >
                {`${r.value >= 0 ? '+' : '−'}${fmt(Math.abs(r.value), 2)}`}
              </text>
            </g>
          )
        })}
        <text x={zero - 6} y={height - 4} fontSize={11} textAnchor="end" fill="var(--ink-3)">
          pushes away
        </text>
        <text x={zero + 6} y={height - 4} fontSize={11} fill="var(--ink-3)">
          pushes towards
        </text>
      </svg>
      <figcaption className="small muted">{caption}</figcaption>
    </figure>
  )
}

const RAMP = ['#eef5f1', '#dcebe2', '#bfd9c9', '#93bda4', '#66a07f', '#3f8463', '#2c6a4d']

export function ConfusionMatrix({ labels, matrix }: { labels: readonly string[]; matrix: number[][] }) {
  const max = Math.max(...matrix.flat(), 1)
  return (
    <table className="data" style={{ tableLayout: 'fixed' }}>
      <caption className="small muted" style={{ captionSide: 'bottom', textAlign: 'left', paddingTop: 6 }}>
        Rows: the real label. Columns: what the model predicted. The diagonal is correct.
      </caption>
      <thead>
        <tr>
          <th style={{ textAlign: 'left' }}>Real ↓ / Predicted →</th>
          {labels.map((l) => (
            <th key={l} style={{ textAlign: 'center' }}>
              {l}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {matrix.map((row, i) => (
          <tr key={labels[i]}>
            <th style={{ textAlign: 'left' }}>{labels[i]}</th>
            {row.map((v, j) => {
              const step = Math.round((v / max) * (RAMP.length - 1))
              return (
                <td
                  key={j}
                  style={{
                    textAlign: 'center',
                    background: RAMP[step],
                    color: step >= 4 ? '#fff' : 'var(--ink)',
                    fontWeight: i === j ? 700 : 400,
                    border: '2px solid #fff',
                  }}
                >
                  {v}
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function WeightLine({ points, target }: { points: { date: string; kg: number }[]; target: number }) {
  if (points.length < 2) return <p className="muted small">Log two weeks to see your trend.</p>
  const W = 340
  const H = 170
  const pad = { l: 36, r: 12, t: 14, b: 26 }
  const ys = [...points.map((p) => p.kg), target]
  const lo = Math.floor(Math.min(...ys) - 0.5)
  const hi = Math.ceil(Math.max(...ys) + 0.5)
  const x = (i: number) => pad.l + (i / (points.length - 1)) * (W - pad.l - pad.r)
  const y = (kg: number) => pad.t + ((hi - kg) / (hi - lo)) * (H - pad.t - pad.b)
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(i)} ${y(p.kg)}`).join(' ')
  const short = (d: string) => new Date(d + 'T00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Weekly weigh-ins">
      {[lo, hi].map((v) => (
        <g key={v}>
          <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke="var(--shelf)" />
          <text x={pad.l - 6} y={y(v) + 4} fontSize={11} textAnchor="end" fill="var(--ink-3)">
            {v}
          </text>
        </g>
      ))}
      <line x1={pad.l} x2={W - pad.r} y1={y(target)} y2={y(target)} stroke="var(--ink-3)" strokeWidth={1} />
      <text x={W - pad.r} y={y(target) - 5} fontSize={11} textAnchor="end" fill="var(--ink-3)">
        Target {target} kg
      </text>
      <path d={path} fill="none" stroke="var(--basil-600)" strokeWidth={2} strokeLinejoin="round" />
      {points.map((p, i) => (
        <g key={p.date}>
          <title>{`${short(p.date)}: ${p.kg} kg`}</title>
          <circle cx={x(i)} cy={y(p.kg)} r={12} fill="transparent" />
          <circle cx={x(i)} cy={y(p.kg)} r={4.5} fill="var(--basil-600)" stroke="#fff" strokeWidth={2} />
        </g>
      ))}
      <text x={x(0)} y={H - 6} fontSize={11} fill="var(--ink-3)">
        {short(points[0].date)}
      </text>
      <text x={x(points.length - 1)} y={H - 6} fontSize={11} textAnchor="end" fill="var(--ink-3)">
        {short(points[points.length - 1].date)}
      </text>
      <text x={x(points.length - 1)} y={y(points[points.length - 1].kg) - 10} fontSize={12} fontWeight={700} textAnchor="end" fill="var(--ink)">
        {points[points.length - 1].kg} kg
      </text>
    </svg>
  )
}
