import { useMemo } from 'react'
import { FOOD_MAP } from '../data/foods'
import { PRICES_CHECKED_ON, PRICE_NOTE, QLD_CATALOG, SEASONAL_SEQ } from '../data/qldGrocery'
import { planShopping } from '../lib/shopping'
import type { AppApi } from '../state'
import type { Store } from '../types'

const money = (v: number) => v.toLocaleString('en-AU', { style: 'currency', currency: 'AUD' })
const STORES: Store[] = ['ALDI', 'Coles', 'Woolworths']
const REASON = { protein: 'protein', produce: 'fruit & veg', energy: 'energy' } as const

export function Shop({ api }: { api: AppApi }) {
  const { state, targets, latestScan } = api
  const profile = state.profile
  const list = useMemo(
    () => (profile && targets ? planShopping(latestScan?.confirmed ?? [], targets, profile, FOOD_MAP, QLD_CATALOG) : null),
    [profile, targets, latestScan],
  )

  if (!list || !profile) return null

  const seasonal = new Set(SEASONAL_SEQ?.foodIds ?? [])
  const pct = (have: number, added: number, need: number) => Math.min(100, Math.round(((have + added) / need) * 100))
  const checked = new Date(PRICES_CHECKED_ON + 'T00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <>
      <div className="page-head">
        <h1>This week's shop</h1>
        <p>
          What to buy for the next 7 days, after counting what is already in your fridge. Only products sold at Queensland supermarkets, within
          your {money(profile.weeklyBudgetAud)} budget.
        </p>
      </div>

      {!latestScan && (
        <div className="notice">
          <p>
            No fridge scan yet, so this list assumes an empty fridge. <a href="#/fridge">Scan your fridge</a> to buy less.
          </p>
        </div>
      )}

      <div className="receipt" aria-label="Shopping list">
        <div style={{ textAlign: 'center' }}>
          <b>FRIDGEFIT WEEKLY SHOP</b>
          <br />
          {new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'short' })}
        </div>
        {STORES.map((store) => {
          const lines = list.lines.filter((l) => l.product.store === store)
          if (!lines.length) return null
          return (
            <section key={store}>
              <h3>{store}</h3>
              {lines.map((l) => (
                <div className="r-line" key={l.product.id}>
                  <span>
                    {l.packs > 1 ? `${l.packs} × ` : ''}
                    {l.product.url ? (
                      <a href={l.product.url} target="_blank" rel="noreferrer">
                        {l.product.productName}
                      </a>
                    ) : (
                      l.product.productName
                    )}
                    {seasonal.has(l.product.foodId) && ' *'}
                  </span>
                  <span>{money(l.cost)}</span>
                  <small>
                    {l.product.packSize}, for {REASON[l.reason]}
                  </small>
                </div>
              ))}
            </section>
          )
        })}
        {list.lines.length === 0 && <p style={{ marginTop: 12 }}>Nothing to buy: your fridge covers the week.</p>}
        <div className="r-total">
          <span>TOTAL</span>
          <span>{money(list.total)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Budget left</span>
          <span>{money(list.budget - list.total)}</span>
        </div>
        {seasonal.size > 0 && <p style={{ marginTop: 10 }}>* in season in South-East Queensland</p>}
      </div>

      <section className="shelf">
        <h2>How much of the week this covers</h2>
        <div className="bar-list">
          {(
            [
              ['Protein', list.have.protein, list.added.protein, list.need.protein, 'g'],
              ['Fruit and veg', list.have.produceG, list.added.produceG, list.need.produceG, 'g'],
              ['Energy', list.have.kcal, list.added.kcal, list.need.kcal, 'kcal'],
            ] as const
          ).map(([label, have, added, need]) => (
            <div className="bar-item" key={label}>
              <span>{label}</span>
              <span className="val">{pct(have, added, need)}%</span>
              <div className="track" role="img" aria-label={`${label}: fridge ${Math.round((have / need) * 100)}%, list adds ${Math.round((added / need) * 100)}%`}>
                <div className="fill" style={{ width: `${Math.min(100, (have / need) * 100)}%`, background: 'var(--basil-300)' }} />
                <div
                  className="fill"
                  style={{ left: `calc(${Math.min(100, (have / need) * 100)}% + 2px)`, width: `${Math.max(0, Math.min(100 - (have / need) * 100, (added / need) * 100))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <p className="small muted">Light: already in your fridge. Dark: added by this list.</p>
        {list.unmet.length > 0 && (
          <div className="notice">
            {list.unmet.map((g) => (
              <p key={g.nutrient}>
                The budget runs out with {g.nutrient === 'kcal' ? `${g.shortBy.toLocaleString('en-AU')} kcal` : `${g.shortBy.toLocaleString('en-AU')} g of ${g.nutrient === 'produce' ? 'fruit and veg' : 'protein'}`} still
                missing for the week.
              </p>
            ))}
            <p className="small">If money is tight, your university's student support service can point you to free food programs.</p>
          </div>
        )}
      </section>

      <p className="small muted">
        Prices checked online on {checked}. {PRICE_NOTE}
      </p>
    </>
  )
}
