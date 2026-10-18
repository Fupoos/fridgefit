import { MiniBar } from '../components/Charts'
import { SafetyNotice } from '../components/SafetyNotice'
import { FOOD_MAP } from '../data/foods'
import { type Key, joinList, useI18n } from '../i18n'
import { macrosOf, produceGramsOf } from '../lib/planner'
import type { AppApi } from '../state'

const fmt = (v: number) => Math.round(v).toLocaleString('en-AU')
const COLS = { '--cols': '4.6rem minmax(0, 1fr) 3.4rem 3.2rem' } as React.CSSProperties

export function Plan({ api }: { api: AppApi }) {
  const { t, food, lang } = useI18n()
  const { plan, targets, goalCheck, latestScan } = api

  if (!plan || !targets || !latestScan) {
    return (
      <>
        <div className="page-head">
          <h1>{t('plan.title')}</h1>
          <p>{t('plan.needScan')}</p>
        </div>
        <a className="btn block" href="#/fridge">
          {t('plan.scan')}
        </a>
      </>
    )
  }

  const lines = plan.meals.flatMap((m) => m.lines)
  const produce = produceGramsOf(lines, FOOD_MAP)
  const weekly = targets.expectedWeeklyChangeKg
  const nutrition = [
    { key: 'n.kcal', value: plan.totals.kcal, target: targets.kcal, unit: 'kcal' },
    { key: 'n.protein', value: plan.totals.protein, target: targets.proteinG, unit: 'g' },
    { key: 'n.carbs', value: plan.totals.carbs, target: targets.carbsG, unit: 'g' },
    { key: 'n.fat', value: plan.totals.fat, target: targets.fatG, unit: 'g' },
    { key: 'n.produce', value: produce, target: 400, unit: 'g' },
  ] as const

  return (
    <>
      <div className="page-head">
        <h1>{t('plan.title')}</h1>
        <p className="small muted">
          {weekly === 0 ? t('plan.maintain') : t('plan.weekly', { kg: `${weekly > 0 ? '+' : '−'}${Math.abs(weekly).toFixed(2)}` })}
        </p>
      </div>

      {goalCheck && !goalCheck.allowed && (
        <SafetyNotice message={t(`safety.${goalCheck.code}` as Key)} showSupport={goalCheck.code !== 'GOAL_MISMATCH'} />
      )}

      <div className="stat-pair">
        {nutrition.slice(0, 2).map((n) => (
          <div className="stat" key={n.key}>
            <span className="label">{t(n.key)}</span>
            <span className="value">
              {fmt(n.value)}
              <span className="small muted"> {n.unit}</span>
            </span>
            <MiniBar value={n.value} max={n.target} />
            <span className="sub">{t('plan.ofTarget', { target: `${fmt(n.target)} ${n.unit}` })}</span>
          </div>
        ))}
      </div>

      <section className="card">
        <div className="card-head">
          <h2>{t('plan.meals')}</h2>
          <span className="aside">{t('plan.tapMeal')}</span>
        </div>
        <div className="xrows" style={COLS}>
          <div className="xrow-head">
            <span>{t('col.meal')}</span>
            <span>{t('col.main')}</span>
            <span className="num">{t('col.kcal')}</span>
            <span className="num">{t('col.protein')}</span>
          </div>
          {plan.meals.map((m) => {
            const mm = macrosOf(m.lines, FOOD_MAP)
            return (
              <details className="xrow" key={m.name}>
                <summary>
                  <span className="strong">{t(`meal.${m.name}` as Key)}</span>
                  <span className="ellipsis small">{m.lines.map((l) => food(l.foodId)).join(lang === 'zh' ? '、' : ', ')}</span>
                  <span className="num">{fmt(mm.kcal)}</span>
                  <span className="num">{fmt(mm.protein)} g</span>
                </summary>
                <div className="xbody">
                  <table className="t">
                    <tbody>
                      {m.lines.map((l) => (
                        <tr key={l.foodId}>
                          <td>{food(l.foodId)}</td>
                          <td className="num">{l.grams} g</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <ol className="steps-list">
                    {m.steps.map((s) => (
                      <li key={s.kind}>{t(`step.${s.kind}` as Key, { items: joinList(s.foods.map(food), lang) })}</li>
                    ))}
                  </ol>
                </div>
              </details>
            )
          })}
        </div>
      </section>

      {plan.gaps.length > 0 && (
        <div className="notice">
          <p>
            {plan.gaps
              .map((g) => t(`gap.${g.nutrient}` as Key, { n: fmt(g.shortBy) }))
              .join(lang === 'zh' ? '；' : '; ')}
          </p>
          <a href="#/shop">{t('plan.toShop')}</a>
        </div>
      )}

      <details className="card">
        <summary>
          <h2>{t('plan.nutrition')}</h2>
        </summary>
        <table className="t">
          <thead>
            <tr>
              <th>{t('col.nutrient')}</th>
              <th className="num">{t('col.plan')}</th>
              <th className="num">{t('col.target')}</th>
              <th className="num">{t('col.diff')}</th>
            </tr>
          </thead>
          <tbody>
            {nutrition.map((n) => {
              const diff = n.value - n.target
              return (
                <tr key={n.key}>
                  <td>{t(n.key)}</td>
                  <td className="num">{fmt(n.value)}</td>
                  <td className="num">{fmt(n.target)}</td>
                  <td className="num">
                    {diff >= 0 ? '+' : '−'}
                    {fmt(Math.abs(diff))} {n.unit}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {targets.floorApplied && <p className="small muted">{t('floor.note', { kcal: fmt(targets.floorKcal) })}</p>}
        {plan.unmatched.length > 0 && <p className="small muted">{t('plan.unmatched', { items: plan.unmatched.join(', ') })}</p>}
      </details>
    </>
  )
}
