import { useState } from 'react'
import { FridgeArt } from '../components/FridgeArt'
import { FOODS } from '../data/foods'
import { DEMO_MAP } from '../data/samples'
import { type Key, useI18n } from '../i18n'
import { getPreview } from '../lib/preview'
import { type AppApi, go } from '../state'
import type { FoodCategory, FridgeItem } from '../types'

const GROUPS: FoodCategory[] = ['protein', 'dairy', 'produce', 'carb', 'fat', 'snack', 'drink']

interface Row {
  item: FridgeItem
  /** Index of the prediction this row came from; null if the user added it. */
  origin: number | null
}

const same = (a: FridgeItem | undefined, b: FridgeItem) =>
  !!a && a.foodId === b.foodId && a.grams === b.grams && a.useWithinDays === b.useWithinDays && a.label === b.label

const COLS = { '--cols': 'minmax(0, 1fr) 4.2rem 4.6rem' } as React.CSSProperties

export function Confirm({ api }: { api: AppApi }) {
  const { t, food } = useI18n()
  const draft = api.state.draft
  const [rows, setRows] = useState<Row[]>(() => draft?.confirmed.map((item, origin) => ({ item: { ...item }, origin })) ?? [])

  if (!draft) {
    return (
      <div className="page-head">
        <h1>{t('confirm.empty')}</h1>
        <p>
          <a href="#/fridge">{t('confirm.goScan')}</a>
        </p>
      </div>
    )
  }

  const demo = draft.sampleId ? DEMO_MAP.get(draft.sampleId) : undefined
  const photo = getPreview()
  const edit = (i: number, patch: Partial<FridgeItem>) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, item: { ...r.item, ...patch } } : r)))
  const original = (r: Row) => (r.origin === null ? undefined : draft.predicted[r.origin])
  const removed = draft.predicted.length - rows.filter((r) => r.origin !== null).length
  const corrections = rows.filter((r) => !same(original(r), r.item)).length + removed

  const save = () => {
    const confirmed = rows
      .map((r) => r.item)
      .filter((r) => r.label.trim() && r.grams > 0)
      .map(({ confidence: _c, ...r }) => r)
    api.update((s) => ({ ...s, draft: null, scans: [...s.scans, { ...draft, confirmed }].slice(-12) }))
    go('/plan')
  }

  return (
    <>
      <div className="page-head">
        <h1>{t('confirm.title')}</h1>
        <p className="small">{t('confirm.lead')}</p>
      </div>

      <section className="card">
        <div className="card-head">
          <h2>{t('col.items')}: {rows.length}</h2>
          {corrections > 0 && <span className="tag">{t('confirm.fixes', { n: corrections })}</span>}
        </div>
        <div className="xrows" style={COLS}>
          <div className="xrow-head">
            <span>{t('col.item')}</span>
            <span className="num">{t('col.grams')}</span>
            <span style={{ textAlign: 'right' }}>{t('col.status')}</span>
          </div>
          {rows.map(({ item: r, origin }, i) => {
            const changed = !same(original(rows[i]), r)
            const conf = origin === null ? undefined : draft.predicted[origin]?.confidence
            const status =
              origin === null ? (
                <span className="tag">{t('status.added')}</span>
              ) : changed ? (
                <span className="tag">{t('status.fixed')}</span>
              ) : conf !== undefined && conf < 0.6 ? (
                <span className="tag unsure">{t('status.unsure')}</span>
              ) : (
                <span className="tag blank">—</span>
              )
            return (
              <details key={origin ?? `new-${i}`} className="xrow">
                <summary>
                  <span className="ellipsis">{r.label}</span>
                  <span className="num">{r.grams}</span>
                  {status}
                </summary>
                <div className="xbody">
                  <div className="item-edit">
                    <label className="span-2">
                      {t('confirm.name')}
                      <input aria-label={t('confirm.name')} value={r.label} onChange={(e) => edit(i, { label: e.target.value })} />
                    </label>
                    <label className="span-2">
                      {t('confirm.match')}
                      <select value={r.foodId} onChange={(e) => edit(i, { foodId: e.target.value, label: e.target.value === 'other' ? r.label : food(e.target.value) })}>
                        {GROUPS.map((g) => (
                          <optgroup key={g} label={t(`cat.${g}` as Key)}>
                            {FOODS.filter((f) => f.category === g).map((f) => (
                              <option key={f.id} value={f.id}>
                                {food(f.id)}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                        <option value="other">{t('confirm.other')}</option>
                      </select>
                    </label>
                    <label>
                      {t('col.grams')}
                      <input type="number" inputMode="numeric" min={0} value={r.grams} onChange={(e) => edit(i, { grams: e.target.valueAsNumber || 0 })} />
                    </label>
                    <label>
                      {t('confirm.useWithin')}
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        value={r.useWithinDays ?? ''}
                        onChange={(e) => edit(i, { useWithinDays: Number.isNaN(e.target.valueAsNumber) ? null : e.target.valueAsNumber })}
                      />
                    </label>
                  </div>
                  <button className="btn ghost small" onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}>
                    {t('confirm.remove')}
                  </button>
                </div>
              </details>
            )
          })}
        </div>
        <button
          className="btn ghost small"
          onClick={() => setRows((rs) => [...rs, { item: { foodId: 'other', label: t('confirm.newItem'), grams: 100, useWithinDays: null }, origin: null }])}
        >
          {t('confirm.add')}
        </button>
      </section>

      <button className="btn block" onClick={save} disabled={rows.length === 0}>
        {t('confirm.save', { n: rows.length })}
      </button>

      <details className="fold">
        <summary>{photo ? t('confirm.showFridge') : demo ? t('confirm.hint') : t('confirm.showFridge')}</summary>
        <div className="stack">
          {photo ? (
            <img src={photo} alt="" style={{ width: '100%', borderRadius: 8 }} />
          ) : demo ? (
            <>
              <p className="small">{t(`mistake.${demo.id}` as Key)}</p>
              <FridgeArt items={demo.actual} title={t(`sample.${demo.id}` as Key)} />
            </>
          ) : null}
          <p className="small muted">{t('confirm.weights')}</p>
        </div>
      </details>
    </>
  )
}
