import { MacroBars } from '../components/Charts'
import { SafetyNotice } from '../components/SafetyNotice'
import { FOOD_MAP } from '../data/foods'
import { produceGramsOf } from '../lib/planner'
import type { AppApi } from '../state'

const fmt = (v: number) => Math.round(v).toLocaleString('en-AU')

export function Plan({ api }: { api: AppApi }) {
  const { plan, targets, goalCheck, latestScan } = api

  if (!plan || !targets || !latestScan) {
    return (
      <>
        <div className="page-head">
          <h1>Today's plan</h1>
          <p>Your meals are built from what is in your fridge, so scan it first.</p>
        </div>
        <a className="btn block" href="#/fridge">
          Scan my fridge
        </a>
      </>
    )
  }

  const lines = plan.meals.flatMap((m) => m.lines)
  const produce = produceGramsOf(lines, FOOD_MAP)
  const weekly = targets.expectedWeeklyChangeKg

  return (
    <>
      <div className="page-head">
        <h1>Today's plan</h1>
        <p>
          Built only from the {latestScan.confirmed.length} items in your fridge. Items that go off soonest are used first.
        </p>
      </div>

      {goalCheck && !goalCheck.allowed && (
        <SafetyNotice message={goalCheck.message!} showSupport={goalCheck.code !== 'GOAL_MISMATCH'} />
      )}
      {targets.floorApplied && (
        <div className="notice">
          <p>
            Your target is held at {fmt(targets.floorKcal)} kcal. FridgeFit never plans below your resting energy needs, even on a cut.
          </p>
        </div>
      )}

      <section className="shelf">
        <div className="shelf-head">
          <h2>Against your targets</h2>
          <span className="aside">
            {weekly === 0 ? 'Maintenance' : `${weekly > 0 ? '+' : '−'}${Math.abs(weekly).toFixed(2)} kg a week expected`}
          </span>
        </div>
        <MacroBars
          rows={[
            { label: 'Calories', value: plan.totals.kcal, target: targets.kcal, unit: 'kcal' },
            { label: 'Protein', value: plan.totals.protein, target: targets.proteinG, unit: 'g' },
            { label: 'Carbs', value: plan.totals.carbs, target: targets.carbsG, unit: 'g' },
            { label: 'Fat', value: plan.totals.fat, target: targets.fatG, unit: 'g' },
            { label: 'Fruit and veg', value: produce, target: 400, unit: 'g' },
          ]}
        />
        <p className="small muted">The black tick is your target.</p>
      </section>

      <section className="shelf">
        <h2>Meals</h2>
        {plan.meals.map((m) => (
          <article className="meal" key={m.name}>
            <div className="shelf-head">
              <h3>{m.name}</h3>
              <span className="aside">
                {fmt(m.lines.reduce((a, l) => a + ((FOOD_MAP.get(l.foodId)?.per100g.kcal ?? 0) * l.grams) / 100, 0))} kcal
              </span>
            </div>
            <ul>
              {m.lines.map((l) => (
                <li key={l.foodId}>
                  <span>{l.label}</span>
                  <span>{l.grams} g</span>
                </li>
              ))}
            </ul>
            <ol>
              {m.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          </article>
        ))}
        <p className="small muted">Weights are as bought: raw meat, dry rice, pasta and oats.</p>
      </section>

      {(plan.gaps.length > 0 || plan.unmatched.length > 0) && (
        <section className="shelf">
          <h2>What your fridge is missing</h2>
          <ul className="steps" style={{ listStyle: 'disc' }}>
            {plan.gaps.map((g) => (
              <li key={g.nutrient}>
                {g.nutrient === 'protein' && `About ${g.shortBy} g of protein short today.`}
                {g.nutrient === 'produce' && `About ${g.shortBy} g of fruit and veg short of 400 g.`}
                {g.nutrient === 'kcal' && `About ${fmt(g.shortBy)} kcal short — eating too little slows recovery.`}{' '}
                <span className="muted">
                  Cheap fixes: {g.suggestions.slice(0, 4).map((id) => FOOD_MAP.get(id)?.name.toLowerCase()).join(', ')}.
                </span>
              </li>
            ))}
            {plan.unmatched.length > 0 && (
              <li>
                Not in our food table, so not planned: {plan.unmatched.join(', ')}.
              </li>
            )}
          </ul>
          <a className="btn" href="#/shop">
            Build my shopping list
          </a>
        </section>
      )}
    </>
  )
}
