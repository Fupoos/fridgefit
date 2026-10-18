import { useMemo, useState } from 'react'
import { MeNav } from '../components/MeNav'
import { SafetyNotice } from '../components/SafetyNotice'
import { computeTargets } from '../lib/nutrition'
import { checkGoal } from '../lib/safety'
import { type AppApi, go } from '../state'
import type { Activity, Allergy, Diet, Goal, Profile as ProfileT, Sex } from '../types'

const BLANK: ProfileT = {
  age: 20,
  sex: 'unspecified',
  heightCm: 170,
  weightKg: 70,
  targetWeightKg: 70,
  goal: 'maintain',
  activity: 'moderate',
  trainingDays: 3,
  weeklyBudgetAud: 70,
  diet: 'any',
  allergies: [],
}

const ACTIVITY: { value: Activity; label: string }[] = [
  { value: 'sedentary', label: 'Mostly sitting (desk, lectures)' },
  { value: 'light', label: 'Light (1–3 workouts a week)' },
  { value: 'moderate', label: 'Moderate (3–5 workouts a week)' },
  { value: 'very', label: 'Very active (6–7 workouts a week)' },
  { value: 'extra', label: 'Athlete or physical job' },
]

const DIETS: { value: Diet; label: string }[] = [
  { value: 'any', label: 'I eat everything' },
  { value: 'no-pork', label: 'No pork' },
  { value: 'pescatarian', label: 'Pescatarian' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
]

const ALLERGIES: Allergy[] = ['dairy', 'egg', 'nuts', 'seafood', 'gluten', 'soy']

const GOALS: { value: Goal; label: string }[] = [
  { value: 'cut', label: 'Lose fat' },
  { value: 'maintain', label: 'Maintain' },
  { value: 'bulk', label: 'Build muscle' },
]

function NumberField(props: { label: string; value: number; onChange: (v: number) => void; min: number; max: number; step?: number; hint?: string }) {
  return (
    <label className="field">
      {props.label}
      <input
        type="number"
        inputMode="decimal"
        value={Number.isNaN(props.value) ? '' : props.value}
        min={props.min}
        max={props.max}
        step={props.step ?? 1}
        onChange={(e) => props.onChange(e.target.valueAsNumber)}
      />
      {props.hint && <span className="hint">{props.hint}</span>}
    </label>
  )
}

export function Profile({ api }: { api: AppApi }) {
  const firstTime = !api.state.profile
  const [p, setP] = useState<ProfileT>(api.state.profile ?? BLANK)
  const set = <K extends keyof ProfileT>(k: K, v: ProfileT[K]) => setP((old) => ({ ...old, [k]: v }))

  const valid =
    p.age >= 16 && p.age <= 80 && p.heightCm >= 130 && p.heightCm <= 220 && p.weightKg >= 35 && p.weightKg <= 250 && p.targetWeightKg >= 35 && p.targetWeightKg <= 250
  const check = useMemo(() => (valid ? checkGoal(p) : null), [p, valid])
  const targets = useMemo(() => (valid ? computeTargets(p) : null), [p, valid])

  const save = () => {
    api.update((s) => ({ ...s, profile: p }))
    go(firstTime ? '/fridge' : '/plan')
  }

  return (
    <>
      {!firstTime && <MeNav current="profile" />}
      <div className="page-head">
        <h1>{firstTime ? 'About you' : 'Profile'}</h1>
        <p>Used to work out your daily targets. It never leaves this phone.</p>
      </div>

      <section className="shelf">
        <div className="grid-2">
          <NumberField label="Age" value={p.age} min={16} max={80} onChange={(v) => set('age', v)} />
          <label className="field">
            Sex for the energy formula
            <select value={p.sex} onChange={(e) => set('sex', e.target.value as Sex)}>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="unspecified">Prefer not to say</option>
            </select>
          </label>
          <NumberField label="Height (cm)" value={p.heightCm} min={130} max={220} onChange={(v) => set('heightCm', v)} />
          <NumberField label="Weight (kg)" value={p.weightKg} min={35} max={250} step={0.1} onChange={(v) => set('weightKg', v)} />
        </div>
      </section>

      <section className="shelf">
        <h2>Goal</h2>
        <div className="chips" role="group" aria-label="Goal">
          {GOALS.map((g) => (
            <button key={g.value} type="button" className="chip" aria-pressed={p.goal === g.value} onClick={() => set('goal', g.value)}>
              {g.label}
            </button>
          ))}
        </div>
        <div className="grid-2">
          <NumberField label="Target weight (kg)" value={p.targetWeightKg} min={35} max={250} step={0.1} onChange={(v) => set('targetWeightKg', v)} />
          <NumberField label="Training days / week" value={p.trainingDays} min={0} max={7} onChange={(v) => set('trainingDays', v)} />
        </div>
        <label className="field">
          Activity
          <select value={p.activity} onChange={(e) => set('activity', e.target.value as Activity)}>
            {ACTIVITY.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="shelf">
        <h2>Food and money</h2>
        <div className="grid-2">
          <label className="field">
            Diet
            <select value={p.diet} onChange={(e) => set('diet', e.target.value as Diet)}>
              {DIETS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </label>
          <NumberField
            label="Weekly grocery budget ($)"
            value={p.weeklyBudgetAud}
            min={10}
            max={400}
            onChange={(v) => set('weeklyBudgetAud', v)}
          />
        </div>
        <div className="stack">
          <span className="small muted">Allergies or intolerances</span>
          <div className="chips">
            {ALLERGIES.map((a) => {
              const on = p.allergies.includes(a)
              return (
                <button
                  key={a}
                  type="button"
                  className="chip"
                  aria-pressed={on}
                  onClick={() => set('allergies', on ? p.allergies.filter((x) => x !== a) : [...p.allergies, a])}
                >
                  {a[0].toUpperCase() + a.slice(1)}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {check && !check.allowed && (
        <SafetyNotice message={check.message!} showSupport={check.code !== 'GOAL_MISMATCH'} />
      )}

      {targets && (
        <section className="shelf">
          <div className="shelf-head">
            <h2>Your daily targets</h2>
            <span className="aside">{targets.goal === 'maintain' ? 'Maintenance' : targets.goal === 'cut' ? 'Fat loss' : 'Muscle gain'}</span>
          </div>
          <div className="stat-row">
            <div className="stat">
              <b>{targets.kcal.toLocaleString('en-AU')}</b>
              <span>kcal</span>
            </div>
            <div className="stat">
              <b>{targets.proteinG}</b>
              <span>g protein</span>
            </div>
            <div className="stat">
              <b>{targets.carbsG}</b>
              <span>g carbs</span>
            </div>
            <div className="stat">
              <b>{targets.fatG}</b>
              <span>g fat</span>
            </div>
          </div>
          {targets.floorApplied && (
            <p className="small">
              Held at {targets.floorKcal.toLocaleString('en-AU')} kcal: FridgeFit never plans below your resting energy needs.
            </p>
          )}
        </section>
      )}

      <button className="btn block" onClick={save} disabled={!valid}>
        {firstTime ? 'Save and scan my fridge' : 'Save profile'}
      </button>
      {!valid && <p className="small muted">Check the numbers: age 16–80, height 130–220 cm, weights 35–250 kg.</p>}
    </>
  )
}
