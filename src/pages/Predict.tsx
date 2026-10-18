import { useMemo, useState } from 'react'
import { ConfusionMatrix, MiniBar, SignedBars } from '../components/Charts'
import { SupportList } from '../components/SafetyNotice'
import { FOOD_MAP } from '../data/foods'
import { type Key, useI18n } from '../i18n'
import { featuresFrom } from '../model/features'
import { contributions, evaluate, predictProba, stratifiedSplit, train } from '../model/softmax'
import { FEATURES, LABELS, generateDataset } from '../model/synthetic'
import type { AppApi } from '../state'

export function Predict({ api }: { api: AppApi }) {
  const { t } = useI18n()
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
  const label = (l: string) => t(`label.${l}` as Key)

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
        <h1>{t('predict.title')}</h1>
        <p className="small muted">{t('predict.demo')}</p>
      </div>

      {!x || !probs || !best ? (
        <>
          <p>{t('predict.needScan')}</p>
          <a className="btn block" href="#/fridge">
            {t('plan.scan')}
          </a>
        </>
      ) : (
        <>
          <section className="card" aria-live="polite">
            <div className={`verdict${best === 'too-fast' ? ' care' : ''}`}>
              <b>{label(best)}</b>
              <span className="small muted">{t('predict.likely', { p: Math.round(Math.max(...probs) * 100) })}</span>
            </div>
            <table className="t">
              <thead>
                <tr>
                  <th>{t('col.outcome')}</th>
                  <th className="num">{t('col.chance')}</th>
                </tr>
              </thead>
              <tbody>
                {LABELS.map((l, i) => (
                  <tr key={l}>
                    <td className={l === best ? 'strong' : undefined} style={{ width: '45%' }}>
                      {label(l)}
                    </td>
                    <td>
                      <div className="bar-cell">
                        <MiniBar value={probs[i]} max={1} strong={l === best} />
                        <span className="num">{Math.round(probs[i] * 100)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="card">
            <h2>{t('predict.why')}</h2>
            <table className="t">
              <thead>
                <tr>
                  <th>{t('col.factor')}</th>
                  <th className="num">{t('col.thisWeek')}</th>
                  <th className="num">{t('col.effect')}</th>
                </tr>
              </thead>
              <tbody>
                {reasons.map((r) => (
                  <tr key={r.feature}>
                    <td>{t(`feature.${r.feature}` as Key)}</td>
                    <td className="num strong">{x[FEATURES.indexOf(r.feature)]}</td>
                    <td className="num">{r.value > 0 ? t('effect.towards') : t('effect.away')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="small muted">{t('predict.notCause')}</p>
          </section>

          {best === 'too-fast' && (
            <div className="notice care">
              <p>{t('predict.careFast')}</p>
              <SupportList />
            </div>
          )}
          {state.profile && state.profile.goal !== 'cut' && <p className="small muted">{t('predict.goalNote')}</p>}
        </>
      )}

      <details className="card">
        <summary>
          <h2>{t('predict.how')}</h2>
        </summary>
        <ol className="steps-list small">
          <li>{t('predict.step1')}</li>
          <li>{t('predict.step2', { n: trained.split.train.length })}</li>
          <li>{t('predict.step3', { n: trained.split.test.length })}</li>
        </ol>
        <div className="table-scroll">
          <table className="t wide">
            <thead>
              <tr>
                {FEATURES.map((f) => (
                  <th key={f} className="num" title={t(`feature.${f}` as Key)}>
                    {t(`abbr.${f}` as Key)}
                  </th>
                ))}
                <th>{t('predict.label')}</th>
              </tr>
            </thead>
            <tbody>
              {trained.split.train.slice(0, 6).map((r, i) => (
                <tr key={i}>
                  {r.x.map((v, j) => (
                    <td key={j} className="num">
                      {v}
                    </td>
                  ))}
                  <td>{label(r.y)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="stat">
          <span className="value">{Math.round(trained.ev.accuracy * 100)}%</span>
          <span className="sub">{t('predict.accuracy', { p: Math.round(trained.ev.accuracy * 100) })}</span>
        </div>
        <ConfusionMatrix labels={LABELS.map(label)} matrix={trained.ev.confusion} caption={t('predict.confusion')} />
        <h3>{t('predict.weights')}</h3>
        <SignedBars
          rows={FEATURES.map((f, j) => ({ label: t(`feature.${f}` as Key), value: trained.model.W[onTrack][j] })).sort((a, b) => b.value - a.value)}
          caption={t('predict.weightsNote')}
          awayLabel={t('chart.away')}
          towardsLabel={t('chart.towards')}
        />
        <div className="row">
          <button className="btn ghost small" onClick={() => setSeed((s) => s + 1)}>
            {t('predict.retrain')}
          </button>
          <button className="btn ghost small" onClick={downloadCsv}>
            {t('predict.download')}
          </button>
        </div>
      </details>
    </>
  )
}
