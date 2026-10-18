/**
 * Small hand-written charts. One hue (terracotta) throughout: magnitude is shown by
 * length or lightness, never by a rainbow. Every value is also printed as text.
 */

const fmt = (v: number, dp = 0) => v.toLocaleString('en-AU', { maximumFractionDigits: dp, minimumFractionDigits: dp })

/** A short bar for use inside table cells; the value itself is always printed next to it. */
export function MiniBar({ value, max, strong = true }: { value: number; max: number; strong?: boolean }) {
  const pct = Math.max(0, Math.min(100, (value / Math.max(max, 1e-9)) * 100))
  return (
    <div className="mini-bar" aria-hidden="true">
      <span style={{ width: `${pct}%`, background: strong ? 'var(--clay-500)' : 'var(--clay-300)' }} />
    </div>
  )
}

/** Signed horizontal bars around a zero line: direction carries the sign. */
export function SignedBars({
  rows,
  caption,
  awayLabel,
  towardsLabel,
}: {
  rows: { label: string; value: number }[]
  caption: string
  awayLabel: string
  towardsLabel: string
}) {
  const rowH = 30
  const labelW = 130
  const width = 340
  const plotW = width - labelW - 44
  const max = Math.max(...rows.map((r) => Math.abs(r.value)), 1e-9)
  const zero = labelW + plotW / 2
  const height = rows.length * rowH + 22
  return (
    <figure style={{ margin: 0 }}>
      <svg className="chart" viewBox={`0 0 ${width} ${height}`} width="100%" role="img" aria-label={caption}>
        <line x1={zero} x2={zero} y1={0} y2={rows.length * rowH} stroke="var(--line-strong)" strokeWidth={1} />
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
              <rect x={x} y={y} width={Math.max(w, 1)} height={12} rx={4} fill="var(--clay-500)" />
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
          {awayLabel}
        </text>
        <text x={zero + 6} y={height - 4} fontSize={11} fill="var(--ink-3)">
          {towardsLabel}
        </text>
      </svg>
      <figcaption className="small muted">{caption}</figcaption>
    </figure>
  )
}

const RAMP = ['#fbf3ea', '#f3e3d3', '#e9cbb0', '#daa982', '#c78a5c', '#b5713f', '#9a5a2e']

export function ConfusionMatrix({ labels, matrix, caption }: { labels: readonly string[]; matrix: number[][]; caption: string }) {
  const max = Math.max(...matrix.flat(), 1)
  return (
    <table className="t" style={{ tableLayout: 'fixed' }}>
      <caption className="small muted" style={{ captionSide: 'bottom', textAlign: 'left', paddingTop: 6 }}>
        {caption}
      </caption>
      <thead>
        <tr>
          <th>↓ / →</th>
          {labels.map((l) => (
            <th key={l} style={{ textAlign: 'center', whiteSpace: 'normal' }}>
              {l}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {matrix.map((row, i) => (
          <tr key={labels[i]}>
            <td className="strong small">{labels[i]}</td>
            {row.map((v, j) => {
              const step = Math.round((v / max) * (RAMP.length - 1))
              return (
                <td
                  key={j}
                  style={{
                    textAlign: 'center',
                    background: RAMP[step],
                    color: step >= 5 ? '#fff' : 'var(--ink)',
                    fontWeight: i === j ? 700 : 400,
                    border: '2px solid var(--card)',
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

export function WeightLine({
  points,
  target,
  targetLabel,
  locale,
}: {
  points: { date: string; kg: number }[]
  target: number
  targetLabel: string
  locale: string
}) {
  const W = 340
  const H = 170
  const pad = { l: 36, r: 12, t: 14, b: 26 }
  const ys = [...points.map((p) => p.kg), target]
  const lo = Math.floor(Math.min(...ys) - 0.5)
  const hi = Math.ceil(Math.max(...ys) + 0.5)
  const x = (i: number) => pad.l + (i / Math.max(1, points.length - 1)) * (W - pad.l - pad.r)
  const y = (kg: number) => pad.t + ((hi - kg) / (hi - lo)) * (H - pad.t - pad.b)
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(i)} ${y(p.kg)}`).join(' ')
  const short = (d: string) => new Date(d + 'T00:00').toLocaleDateString(locale, { day: 'numeric', month: 'short' })
  const last = points[points.length - 1]
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={targetLabel}>
      {[lo, hi].map((v) => (
        <g key={v}>
          <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke="var(--line)" />
          <text x={pad.l - 6} y={y(v) + 4} fontSize={11} textAnchor="end" fill="var(--ink-3)">
            {v}
          </text>
        </g>
      ))}
      <line x1={pad.l} x2={W - pad.r} y1={y(target)} y2={y(target)} stroke="var(--ink-3)" strokeWidth={1} />
      <text x={W - pad.r} y={y(target) - 5} fontSize={11} textAnchor="end" fill="var(--ink-3)">
        {targetLabel}
      </text>
      <path d={path} fill="none" stroke="var(--clay-600)" strokeWidth={2} strokeLinejoin="round" />
      {points.map((p, i) => (
        <g key={p.date}>
          <title>{`${short(p.date)}: ${p.kg} kg`}</title>
          <circle cx={x(i)} cy={y(p.kg)} r={12} fill="transparent" />
          <circle cx={x(i)} cy={y(p.kg)} r={4.5} fill="var(--clay-600)" stroke="var(--card)" strokeWidth={2} />
        </g>
      ))}
      <text x={x(0)} y={H - 6} fontSize={11} fill="var(--ink-3)">
        {short(points[0].date)}
      </text>
      <text x={x(points.length - 1)} y={H - 6} fontSize={11} textAnchor="end" fill="var(--ink-3)">
        {short(last.date)}
      </text>
      <text x={x(points.length - 1)} y={y(last.kg) - 10} fontSize={12} fontWeight={700} textAnchor="end" fill="var(--ink)">
        {last.kg} kg
      </text>
    </svg>
  )
}
