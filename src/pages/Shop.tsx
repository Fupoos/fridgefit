import { useMemo } from 'react'
import { FOOD_MAP } from '../data/foods'
import { PRICES_CHECKED_ON, QLD_CATALOG, SEASONAL_SEQ } from '../data/qldGrocery'
import { type Key, useI18n } from '../i18n'
import { planShopping } from '../lib/shopping'
import type { AppApi } from '../state'
import type { Store } from '../types'

const money = (v: number) => v.toLocaleString('en-AU', { style: 'currency', currency: 'AUD' })
const STORES: Store[] = ['ALDI', 'Coles', 'Woolworths']

export function Shop({ api }: { api: AppApi }) {
  const { t, locale } = useI18n()
  const { state, targets, latestScan } = api
  const profile = state.profile
  const list = useMemo(
    () => (profile && targets ? planShopping(latestScan?.confirmed ?? [], targets, profile, FOOD_MAP, QLD_CATALOG) : null),
    [profile, targets, latestScan],
  )

  if (!list || !profile) return null

  const seasonal = new Set(SEASONAL_SEQ?.foodIds ?? [])
  const byStore = STORES.map((store) => {
    const lines = list.lines.filter((l) => l.product.store === store)
    return { store, lines, items: lines.reduce((a, l) => a + l.packs, 0), subtotal: lines.reduce((a, l) => a + l.cost, 0) }
  }).filter((s) => s.lines.length > 0)
  const pct = (part: number, need: number) => Math.min(100, Math.round((part / need) * 100))
  const checked = new Date(PRICES_CHECKED_ON + 'T00:00').toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <>
      <div className="page-head">
        <h1>{t('shop.title')}</h1>
        <p className="small">{t('shop.lead')}</p>
      </div>

      {!latestScan && (
        <div className="notice">
          <p>{t('shop.noScan')}</p>
        </div>
      )}

      <div className="stat-pair">
        <div className="stat">
          <span className="label">{t('shop.total')}</span>
          <span className="value">{money(list.total)}</span>
        </div>
        <div className="stat">
          <span className="label">{t('shop.left')}</span>
          <span className="value">{money(list.budget - list.total)}</span>
        </div>
      </div>

      {byStore.length > 0 ? (
        <section className="card">
          <h2>{t('shop.byStore')}</h2>
          <table className="t">
            <thead>
              <tr>
                <th>{t('col.store')}</th>
                <th className="num">{t('col.items')}</th>
                <th className="num">{t('col.subtotal')}</th>
              </tr>
            </thead>
            <tbody>
              {byStore.map((s) => (
                <tr key={s.store}>
                  <td className="strong">{s.store}</td>
                  <td className="num">{s.items}</td>
                  <td className="num">{money(s.subtotal)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td>{t('shop.total')}</td>
                <td className="num">{byStore.reduce((a, s) => a + s.items, 0)}</td>
                <td className="num">{money(list.total)}</td>
              </tr>
            </tfoot>
          </table>
        </section>
      ) : (
        <p>{t('shop.nothing')}</p>
      )}

      {byStore.length > 0 && (
        <div className="receipt" aria-label={t('shop.receiptTitle')}>
          <div style={{ textAlign: 'center' }}>
            <b>{t('shop.receiptTitle')}</b>
          </div>
          {byStore.map(({ store, lines }) => (
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
                  <small>{t(`shop.for.${l.reason}` as Key)}</small>
                </div>
              ))}
            </section>
          ))}
        </div>
      )}

      {list.unmet.length > 0 && (
        <div className="notice">
          {list.unmet.map((g) => (
            <p key={g.nutrient}>{t(`shop.unmet.${g.nutrient}` as Key, { n: g.shortBy.toLocaleString('en-AU') })}</p>
          ))}
          <p className="small">{t('shop.help')}</p>
        </div>
      )}

      <details className="card">
        <summary>
          <h2>{t('shop.coverage')}</h2>
        </summary>
        <table className="t">
          <thead>
            <tr>
              <th>{t('col.nutrient')}</th>
              <th className="num">{t('col.plan')}</th>
            </tr>
          </thead>
          <tbody>
            {(
              [
                ['n.protein', list.have.protein, list.added.protein, list.need.protein],
                ['n.produce', list.have.produceG, list.added.produceG, list.need.produceG],
                ['n.kcal', list.have.kcal, list.added.kcal, list.need.kcal],
              ] as const
            ).map(([key, have, added, need]) => (
              <tr key={key}>
                <td style={{ width: '40%' }}>{t(key)}</td>
                <td>
                  <div className="bar-cell">
                    <div className="mini-bar" style={{ display: 'flex' }} aria-hidden="true">
                      <span style={{ width: `${pct(have, need)}%`, background: 'var(--clay-300)' }} />
                      <span style={{ width: `${Math.max(0, pct(have + added, need) - pct(have, need))}%`, background: 'var(--clay-600)' }} />
                    </div>
                    <span className="num">{pct(have + added, need)}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="small muted">{t('shop.coverageNote')}</p>
      </details>

      <p className="small muted">
        {t('shop.prices', { date: checked })}
        {seasonal.size > 0 && ` ${t('shop.seasonal')}`}
      </p>
    </>
  )
}
