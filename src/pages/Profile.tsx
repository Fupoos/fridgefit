import { useMemo, useState } from 'react'
import { MeNav } from '../components/MeNav'
import { SafetyNotice } from '../components/SafetyNotice'
import { type Key, useI18n } from '../i18n'
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

const ACTIVITY: Activity[] = ['sedentary', 'light', 'moderate', 'very', 'extra']
const DIETS: Diet[] = ['any', 'no-pork', 'pescatarian', 'vegetarian', 'vegan']
const ALLERGIES: Allergy[] = ['dairy', 'egg', 'nuts', 'seafood', 'gluten', 'soy']
const GOALS: Goal[] = ['cut', 'maintain', 'bulk']

function NumberField(props: { label: string; value: number; onChange: (v: number) => void; min: number; max: number; step?: number }) {
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
    </label>
  )
}

export function Profile({ api }: { api: AppApi }) {
  const { t } = useI18n()
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
        <h1>{firstTime ? t('profile.title') : t('profile.titleEdit')}</h1>
        <p className="small">{t('profile.lead')}</p>
      </div>

      <section className="card">
        <div className="grid-2">
          <label className="field">
            {t('f.sex')}
            <select value={p.sex} onChange={(e) => set('sex', e.target.value as Sex)}>
              {(['female', 'male', 'unspecified'] as Sex[]).map((s) => (
                <option key={s} value={s}>
                  {t(`sex.${s}` as Key)}
                </option>
              ))}
            </select>
          </label>
          <NumberField label={t('f.age')} value={p.age} min={16} max={80} onChange={(v) => set('age', v)} />
          <NumberField label={t('f.height')} value={p.heightCm} min={130} max={220} onChange={(v) => set('heightCm', v)} />
          <NumberField label={t('f.weight')} value={p.weightKg} min={35} max={250} step={0.1} onChange={(v) => set('weightKg', v)} />
        </div>
        <div className="stack">
          <span className="small muted">{t('f.goal')}</span>
          <div className="chips" role="group" aria-label={t('f.goal')}>
            {GOALS.map((g) => (
              <button key={g} type="button" className="chip" aria-pressed={p.goal === g} onClick={() => set('goal', g)}>
                {t(`goal.${g}` as Key)}
              </button>
            ))}
          </div>
        </div>
        <NumberField label={t('f.target')} value={p.targetWeightKg} min={35} max={250} step={0.1} onChange={(v) => set('targetWeightKg', v)} />

        <details className="fold">
          <summary>{t('profile.more')}</summary>
          <div className="stack">
            <label className="field">
              {t('f.activity')}
              <select value={p.activity} onChange={(e) => set('activity', e.target.value as Activity)}>
                {ACTIVITY.map((a) => (
                  <option key={a} value={a}>
                    {t(`act.${a}` as Key)}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid-2">
              <NumberField label={t('f.trainingDays')} value={p.trainingDays} min={0} max={7} onChange={(v) => set('trainingDays', v)} />
              <NumberField label={t('f.budget')} value={p.weeklyBudgetAud} min={10} max={400} onChange={(v) => set('weeklyBudgetAud', v)} />
            </div>
            <label className="field">
              {t('f.diet')}
              <select value={p.diet} onChange={(e) => set('diet', e.target.value as Diet)}>
                {DIETS.map((d) => (
                  <option key={d} value={d}>
                    {t(`diet.${d}` as Key)}
                  </option>
                ))}
              </select>
            </label>
            <span className="small muted">{t('f.allergies')}</span>
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
                    {t(`allergy.${a}` as Key)}
                  </button>
                )
              })}
            </div>
          </div>
        </details>
      </section>

      {check && !check.allowed && <SafetyNotice message={t(`safety.${check.code}` as Key)} showSupport={check.code !== 'GOAL_MISMATCH'} />}

      {targets && (
        <section className="card">
          <div className="card-head">
            <h2>{t('profile.targets')}</h2>
            <span className="aside">{t(`goal.${targets.goal}` as Key)}</span>
          </div>
          <table className="t">
            <thead>
              <tr>
                <th>{t('col.nutrient')}</th>
                <th className="num">{t('col.amount')}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{t('n.kcal')}</td>
                <td className="num strong">{targets.kcal.toLocaleString('en-AU')} kcal</td>
              </tr>
              <tr>
                <td>{t('n.protein')}</td>
                <td className="num strong">{targets.proteinG} g</td>
              </tr>
              <tr>
                <td>{t('n.carbs')}</td>
                <td className="num">{targets.carbsG} g</td>
              </tr>
              <tr>
                <td>{t('n.fat')}</td>
                <td className="num">{targets.fatG} g</td>
              </tr>
            </tbody>
          </table>
          {targets.floorApplied && <p className="small muted">{t('floor.note', { kcal: targets.floorKcal.toLocaleString('en-AU') })}</p>}
        </section>
      )}

      <button className="btn block" onClick={save} disabled={!valid}>
        {firstTime ? t('profile.saveFirst') : t('profile.save')}
      </button>
      {!valid && <p className="small muted">{t('profile.invalid')}</p>}
    </>
  )
}
