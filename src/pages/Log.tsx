import { useState } from 'react'
import { WeightLine } from '../components/Charts'
import { MeNav } from '../components/MeNav'
import type { AppApi } from '../state'
import type { WeeklyLog } from '../types'

function mondayOf(d: Date): string {
  const day = (d.getDay() + 6) % 7
  const m = new Date(d.getFullYear(), d.getMonth(), d.getDate() - day)
  return `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}-${String(m.getDate()).padStart(2, '0')}`
}

export function Log({ api }: { api: AppApi }) {
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

  const num = (label: string, k: keyof Omit<WeeklyLog, 'weekStart'>, step = 1, hint?: string) => (
    <label className="field">
      {label}
      <input type="number" inputMode="decimal" step={step} min={0} value={Number.isNaN(f[k]) ? '' : f[k]} onChange={(e) => set(k, e.target.valueAsNumber)} />
      {hint && <span className="hint">{hint}</span>}
    </label>
  )

  return (
    <>
      <MeNav current="log" />
      <div className="page-head">
        <h1>Weekly check-in</h1>
        <p>One minute a week. Your weigh-in is the label the predictor learns from; the rest are its inputs.</p>
      </div>

      <section className="shelf">
        <div className="grid-2">
          <label className="field">
            Week starting
            <input type="date" value={f.weekStart} onChange={(e) => set('weekStart', e.target.value)} />
          </label>
          {num('Weigh-in (kg)', 'weightKg', 0.1, 'Same scale, same time of day')}
          {num('Training sessions', 'sessions')}
          {num('Steps a day (thousands)', 'avgStepsK', 0.1, 'From Apple Health or Google Fit')}
          {num('Sleep a night (hours)', 'avgSleepH', 0.1)}
          {num('Items thrown out unused', 'expiredUnused')}
          {num('Grocery trips', 'restocks')}
          {num('Takeaway or delivery orders', 'takeawayOrders', 1, 'Could come from a linked Uber Eats account')}
        </div>
        <button className="btn block" onClick={save}>
          Save check-in
        </button>
        {saved && (
          <p className="small" role="status">
            Saved. <a href="#/predict">See your prediction</a>
          </p>
        )}
      </section>

      <section className="shelf">
        <h2>Weigh-ins</h2>
        <WeightLine points={state.logs.map((l) => ({ date: l.weekStart, kg: l.weightKg }))} target={state.profile?.targetWeightKg ?? f.weightKg} />
      </section>
    </>
  )
}
