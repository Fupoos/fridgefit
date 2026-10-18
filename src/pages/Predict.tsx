import { useMemo, useState } from 'react'
import { ConfusionMatrix, ProbBars, SignedBars } from '../components/Charts'
import { SupportList } from '../components/SafetyNotice'
import { FOOD_MAP } from '../data/foods'
import { featuresFrom } from '../model/features'
import { contributions, evaluate, predictProba, stratifiedSplit, train } from '../model/softmax'
import { FEATURES, FEATURE_INFO, LABELS, generateDataset } from '../model/synthetic'
import type { AppApi } from '../state'
import type { Label } from '../types'

const NICE: Record<Label, string> = { 'on-track': 'On track', stalled: 'Likely to stall', 'too-fast': 'Losing too fast' }
const ABBR = ['Prot', 'Veg', 'UPF', 'Exp', 'Rest', 'Train', 'Steps', 'Sleep', 'Take']

export function Predict({ api }: { api: AppApi }) {
  const [seed, setSeed] = useState(1130)

  const trained = useMemo(() => {
    const rows = generateDataset(300, seed)
    const split = stratifiedSplit(rows, 0.2, seed)
    const model = train(
      split.train.map((r) => r.x),
      split.train.map((r) => r.y),
    )
    const ev = evaluate(
      model,
      split.test.map((r) => r.x),
      split.test.map((r) => r.y),
    )
    return { rows, split, model, ev }
  }, [seed])

  const { latestScan, latestLog, state } = api
  const x = latestScan ? featuresFrom(latestScan.confirmed, latestLog, FOOD_MAP) : null
  const probs = x ? predictProba(trained.model, x) : null
  const best = probs ? LABELS[probs.indexOf(Math.max(...probs))] : null
  const reasons = x ? contributions(trained.model, x).slice(0, 3) : []
  const onTrack = LABELS.indexOf('on-track')

  const downloadCsv = () => {
    const header = [...FEATURES, 'label'].join(',')
    const body = trained.rows.map((r) => [...r.x, r.y].join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([`${header}\n${body}\n`], { type: 'text/csv' }))
    const a = Object.assign(document.createElement('a'), { href: url, download: `fridgefit-synthetic-seed${seed}.csv` })
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <div className="page-head">
        <h1>Next week's weigh-in</h1>
        <p>A supervised model reads this week's fridge and habits, and predicts whether next week's weigh-in moves the way your plan expects.</p>
      </div>

      <div className="notice">
        <p>
          <b>Demo model.</b> It is trained on 300 synthetic student-weeks made by a documented rule, not on real people. It shows how the real
          model would learn once students donate labelled weeks.
        </p>
      </div>

      <section className="shelf" aria-live="polite">
        <h2>This week</h2>
        {!x || !probs || !best ? (
          <>
            <p className="muted">Scan your fridge to get a prediction.</p>
            <a className="btn" href="#/fridge">
              Scan my fridge
            </a>
          </>
        ) : (
          <>
            <div className={`verdict${best === 'too-fast' ? ' care' : ''}`}>
              <b>{NICE[best]}</b>
              <span className="muted small">
                {Math.round(Math.max(...probs) * 100)}% likely, from your last scan
                {latestLog ? ' and your latest check-in' : ' and typical habits (no check-in yet)'}
              </span>
            </div>
            <ProbBars rows={LABELS.map((l, i) => ({ label: NICE[l], p: probs[i] }))} highlight={NICE[best]} />
            <div className="stack">
              <h3>What pushed this prediction</h3>
              <ul className="steps" style={{ listStyle: 'disc' }}>
                {reasons.map((r) => (
                  <li key={r.feature}>
                    {FEATURE_INFO[r.feature].label}: <b>{x[FEATURES.indexOf(r.feature)]}</b>, which pushed {r.value > 0 ? 'towards' : 'away from'} “
                    {NICE[best].toLowerCase()}”.
                  </li>
                ))}
              </ul>
              <p className="small muted">These are patterns the model found, not causes. Emptying your fridge will not make you “on track”.</p>
            </div>
            {best === 'too-fast' && (
              <div className="notice care">
                <p>
                  Losing weight faster than planned often means eating too little for your training. Your plan will not cut further. If eating
                  feels hard to manage, these services are free and confidential:
                </p>
                <SupportList />
              </div>
            )}
            {state.profile && state.profile.goal !== 'cut' && (
              <p className="small muted">The demo model only saw fat-loss weeks, so it is less reliable for your goal.</p>
            )}
          </>
        )}
      </section>

      <section className="shelf">
        <h2>How the model learned</h2>
        <ol className="steps">
          <li>
            <b>Labelled examples.</b> Each row is one student-week: nine numbers from the fridge and habits, plus the label, which is what the
            following weigh-in did.
          </li>
          <li>
            <b>Training.</b> {trained.split.train.length} rows fit a multinomial logistic regression: one weight per feature per label.
          </li>
          <li>
            <b>Testing.</b> {trained.split.test.length} rows the model never saw check whether it generalises.
          </li>
        </ol>
        <div className="table-scroll">
          <table className="data">
            <thead>
              <tr>
                {ABBR.map((a, j) => (
                  <th key={a} title={FEATURE_INFO[FEATURES[j]].label}>
                    {a}
                  </th>
                ))}
                <th>Label</th>
              </tr>
            </thead>
            <tbody>
              {trained.split.train.slice(0, 8).map((r, i) => (
                <tr key={i}>
                  {r.x.map((v, j) => (
                    <td key={j}>{v}</td>
                  ))}
                  <td>{r.y}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="small muted">
          Prot = protein-source items, Veg = fruit and veg items, UPF = ultra-processed items, Exp = items expired unused, Rest = restocks, Train =
          sessions, Steps = thousand steps a day, Sleep = hours, Take = takeaway orders. In the real app, takeaway orders could come from a linked
          delivery account; here you log them by hand.
        </p>
      </section>

      <section className="shelf">
        <div className="shelf-head">
          <h2>Test results</h2>
          <span className="aside">{trained.split.test.length} unseen weeks</span>
        </div>
        <div className="stat">
          <b style={{ fontSize: '2.4rem' }}>{Math.round(trained.ev.accuracy * 100)}%</b>
          <span>of unseen weeks labelled correctly</span>
        </div>
        <ConfusionMatrix labels={LABELS} matrix={trained.ev.confusion} />
      </section>

      <section className="shelf">
        <h2>What the model learned about “on track”</h2>
        <SignedBars
          rows={FEATURES.map((f, j) => ({ label: FEATURE_INFO[f].short, value: trained.model.W[onTrack][j] }))
            .sort((a, b) => b.value - a.value)}
          caption="Weight per standard deviation of each feature. Longer bars matter more."
        />
        <div className="row">
          <button className="btn ghost" onClick={() => setSeed((s) => s + 1)}>
            Retrain on a new sample
          </button>
          <button className="btn ghost" onClick={downloadCsv}>
            Download training data
          </button>
        </div>
        {seed !== 1130 && <p className="small muted">Sample {seed - 1130 + 1}: results shift a little with each new sample.</p>}
      </section>
    </>
  )
}
