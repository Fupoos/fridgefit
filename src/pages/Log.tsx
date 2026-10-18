import { useState } from 'react'
import { WeightLine } from '../components/Charts'
import { MeNav } from '../components/MeNav'
import { type Key, useI18n } from '../i18n'
import type { AppApi } from '../state'
import type { WeeklyLog } from '../types'

function mondayOf(d: Date): string {
  const day = (d.getDay() + 6) % 7
  const m = new Date(d.getFullYear(), d.getMonth(), d.getDate() - day)
  return `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}-${String(m.getDate()).padStart(2, '0')}`
}

export function Log({ api }: { api: AppApi }) {
  const { t, locale } = useI18n()
  const { state } = api
  const last = api.latestLog
  const [f, setF] = useState<WeeklyLog>(() => ({
    weekStart: mondayOf(new Date()),
    weightKg: last?.weightKg ?? state.profile?.weightKg ?? 70,
    sessions: last?.sessions ?? state.profile?.trainingDays ?? 3,
    avgStepsK: last?.avgStepsK ?? 7.5,
    avgSleepH: last?.avgSleepH ?? 7,
    expiredUnused: 0,
    restocks: 1,
    takeawayOrders: 0,
  }))
  const [saved, setSaved] = useState(false)
  const set = <K extends keyof WeeklyLog>(k: K, v: WeeklyLog[K]) => {
    setSaved(false)
    setF((o) => ({ ...o, [k]: v }))
  }

  const save = () => {
    api.update((s) => ({ ...s, logs: [...s.logs.filter((l) => l.weekStart !== f.weekStart), f].sort((a, b) => a.weekStart.localeCompare(b.weekStart)) }))
    setSaved(true)
  }

  const num = (label: Key, k: keyof Omit<WeeklyLog, 'weekStart'>, step = 1, hint?: Key) => (
    <label className="field">
      {t(label)}
      <input type="number" inputMode="decimal" step={step} min={0} value={Number.isNaN(f[k]) ? '' : f[k]} onChange={(e) => set(k, e.target.valueAsNumber)} />
      {hint && <span className="hint">{t(hint)}</span>}
    </label>
  )

  const logs = [...state.logs].sort((a, b) => a.weekStart.localeCompare(b.weekStart))
  const short = (d: string) => new Date(d + 'T00:00').toLocaleDateString(locale, { day: 'numeric', month: 'short' })

  return (
    <>
      <MeNav current="log" />
      <div className="page-head">
        <h1>{t('log.title')}</h1>
        <p className="small">{t('log.lead')}</p>
      </div>

      <section className="card">
        <div className="grid-2">
          <label className="field">
            {t('f.week')}
            <input type="date" value={f.weekStart} onChange={(e) => set('weekStart', e.target.value)} />
          </label>
          {num('f.weighIn', 'weightKg', 0.1)}
          {num('f.sessions', 'sessions')}
          {num('f.takeaway', 'takeawayOrders', 1, 'log.takeawayHint')}
        </div>
        <details className="fold">
          <summary>{t('log.more')}</summary>
          <div className="grid-2">
            {num('f.steps', 'avgStepsK', 0.1)}
            {num('f.sleep', 'avgSleepH', 0.1)}
            {num('f.expired', 'expiredUnused')}
            {num('f.trips', 'restocks')}
          </div>
        </details>
        <button className="btn block" onClick={save}>
          {t('log.save')}
        </button>
        {saved && (
          <p className="small" role="status">
            {t('log.saved')} <a href="#/predict">{t('log.seeForecast')}</a>
          </p>
        )}
      </section>

      <section className="card">
        <h2>{t('log.history')}</h2>
        {logs.length < 2 ? (
          <p className="muted small">{t('log.twoWeeks')}</p>
        ) : (
          <WeightLine
            points={logs.map((l) => ({ date: l.weekStart, kg: l.weightKg }))}
            target={state.profile?.targetWeightKg ?? f.weightKg}
            targetLabel={t('chart.target', { kg: state.profile?.targetWeightKg ?? f.weightKg })}
            locale={locale}
          />
        )}
        {logs.length > 0 && (
          <table className="t">
            <thead>
              <tr>
                <th>{t('col.week')}</th>
                <th className="num">{t('col.weight')}</th>
                <th className="num">{t('col.change')}</th>
                <th className="num">{t('col.train')}</th>
                <th className="num">{t('col.take')}</th>
              </tr>
            </thead>
            <tbody>
              {[...logs].reverse().map((l) => {
                const i = logs.indexOf(l)
                const change = i > 0 ? l.weightKg - logs[i - 1].weightKg : null
                return (
                  <tr key={l.weekStart}>
                    <td>{short(l.weekStart)}</td>
                    <td className="num strong">{l.weightKg}</td>
                    <td className="num">{change === null ? '—' : `${change > 0 ? '+' : change < 0 ? '−' : ''}${Math.abs(change).toFixed(1)}`}</td>
                    <td className="num">{l.sessions}</td>
                    <td className="num">{l.takeawayOrders}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </section>
    </>
  )
}
