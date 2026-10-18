import { useState } from 'react'
import { FridgeArt } from '../components/FridgeArt'
import { CloseIcon } from '../components/Icons'
import { FOODS, FOOD_MAP } from '../data/foods'
import { DEMO_MAP } from '../data/samples'
import { getPreview } from '../lib/preview'
import { type AppApi, go } from '../state'
import type { FoodCategory, FridgeItem } from '../types'

const GROUPS: { cat: FoodCategory; label: string }[] = [
  { cat: 'protein', label: 'Protein' },
  { cat: 'dairy', label: 'Dairy and alternatives' },
  { cat: 'produce', label: 'Fruit and veg' },
  { cat: 'carb', label: 'Grains and starches' },
  { cat: 'fat', label: 'Fats, nuts and spreads' },
  { cat: 'snack', label: 'Snacks and ready meals' },
  { cat: 'drink', label: 'Drinks' },
]

interface Row {
  item: FridgeItem
  origin: number | null
}

const same = (a: FridgeItem | undefined, b: FridgeItem) =>
  !!a && a.foodId === b.foodId && a.grams === b.grams && a.useWithinDays === b.useWithinDays && a.label === b.label

export function Confirm({ api }: { api: AppApi }) {
  const draft = api.state.draft
  // Each row remembers which prediction it came from (null = added by the user).
  const [rows, setRows] = useState<Row[]>(() => draft?.confirmed.map((item, origin) => ({ item: { ...item }, origin })) ?? [])
  const [showHint, setShowHint] = useState(false)

  if (!draft) {
    return (
      <div className="page-head">
        <h1>Nothing to check yet</h1>
        <p>
          <a href="#/fridge">Scan your fridge or pick a sample</a> first.
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
        <h1>Check what we found</h1>
        <p>Fix anything the scanner got wrong. Every fix becomes a labelled example, which is how a scanner like this learns.</p>
      </div>

      <section className="shelf">
        {photo ? (
          <img src={photo} alt="Your fridge photo" style={{ width: '100%', borderRadius: 8 }} />
        ) : demo ? (
          <FridgeArt items={demo.actual} title={`Sample fridge: ${demo.name}`} />
        ) : null}
        {demo && (
          <div className="small">
            <button className="linkish" onClick={() => setShowHint((v) => !v)}>
              {showHint ? 'Hide the scanner’s mistakes' : 'Stuck? Show the scanner’s mistakes'}
            </button>
            {showHint && <p className="muted">{demo.mistakes}</p>}
          </div>
        )}
      </section>

      <section className="shelf">
        <div className="shelf-head">
          <h2>{rows.length} items</h2>
          <span className="aside">
            {corrections} correction{corrections === 1 ? '' : 's'}
          </span>
        </div>
        <div>
          {rows.map(({ item: r, origin }, i) => {
            const changed = !same(original(rows[i]), r)
            const conf = origin === null ? undefined : draft.predicted[origin]?.confidence
            return (
              <div key={origin ?? `new-${i}`} className={`item-row${changed ? ' changed' : ''}`}>
                <input className="label-input" aria-label="Item name" value={r.label} onChange={(e) => edit(i, { label: e.target.value })} />
                <div className="row" style={{ flexWrap: 'nowrap' }}>
                  {changed ? <span className="tag">Corrected</span> : conf !== undefined && conf < 0.6 ? <span className="tag warn">Unsure</span> : null}
                  <button className="icon-btn" aria-label={`Remove ${r.label}`} onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}>
                    <CloseIcon width={18} height={18} />
                  </button>
                </div>
                <div className="item-fields">
                  <label>
                    Matches
                    <select value={r.foodId} onChange={(e) => edit(i, { foodId: e.target.value, label: FOOD_MAP.get(e.target.value)?.name ?? r.label })}>
                      {GROUPS.map((g) => (
                        <optgroup key={g.cat} label={g.label}>
                          {FOODS.filter((f) => f.category === g.cat).map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.name}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                      <option value="other">Something else</option>
                    </select>
                  </label>
                  <label>
                    Grams
                    <input type="number" inputMode="numeric" min={0} value={r.grams} onChange={(e) => edit(i, { grams: e.target.valueAsNumber || 0 })} />
                  </label>
                  <label>
                    Use within
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      placeholder="days"
                      value={r.useWithinDays ?? ''}
                      onChange={(e) => edit(i, { useWithinDays: Number.isNaN(e.target.valueAsNumber) ? null : e.target.valueAsNumber })}
                    />
                  </label>
                </div>
              </div>
            )
          })}
        </div>
        <button
          className="btn ghost"
          onClick={() => setRows((rs) => [...rs, { item: { foodId: 'other', label: 'New item', grams: 100, useWithinDays: null }, origin: null }])}
        >
          Add a missing item
        </button>
      </section>

      <button className="btn block" onClick={save} disabled={rows.length === 0}>
        Save {rows.length} items and plan my meals
      </button>
      <p className="small muted">
        Weights are as bought (raw meat, dry rice and oats). Rough guesses are fine. {corrections > 0 && `Your ${corrections} correction${corrections === 1 ? '' : 's'} will be saved as labels with this scan.`}
      </p>
    </>
  )
}
