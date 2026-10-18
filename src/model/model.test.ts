import { describe, expect, it } from 'vitest'
import { FEATURES, LABELS, generateDataset, mulberry32 } from './synthetic'
import { contributions, evaluate, predictProba, stratifiedSplit, train } from './softmax'

describe('mulberry32', () => {
  it('is deterministic for a seed', () => {
    const a = mulberry32(42)
    const b = mulberry32(42)
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
  })

  it('returns numbers in [0, 1)', () => {
    const r = mulberry32(7)
    for (let i = 0; i < 1000; i++) {
      const v = r()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })
})

describe('generateDataset', () => {
  const rows = generateDataset(300, 1130)

  it('is reproducible for the same seed', () => {
    expect(generateDataset(300, 1130)).toEqual(rows)
  })

  it('produces one value per feature and a known label', () => {
    expect(rows).toHaveLength(300)
    for (const r of rows) {
      expect(r.x).toHaveLength(FEATURES.length)
      expect(LABELS).toContain(r.y)
    }
  })

  it('keeps every class between 20% and 45% of rows', () => {
    for (const label of LABELS) {
      const share = rows.filter((r) => r.y === label).length / rows.length
      expect(share).toBeGreaterThanOrEqual(0.2)
      expect(share).toBeLessThanOrEqual(0.45)
    }
  })

  it('keeps feature values inside realistic ranges', () => {
    const idx = (f: (typeof FEATURES)[number]) => FEATURES.indexOf(f)
    for (const r of rows) {
      expect(r.x[idx('sleepH')]).toBeGreaterThanOrEqual(4)
      expect(r.x[idx('sleepH')]).toBeLessThanOrEqual(10)
      expect(r.x[idx('sessions')]).toBeGreaterThanOrEqual(0)
      expect(r.x[idx('sessions')]).toBeLessThanOrEqual(7)
      expect(Number.isInteger(r.x[idx('proteinItems')])).toBe(true)
    }
  })
})

describe('softmax regression', () => {
  const rows = generateDataset(300, 1130)
  const { train: tr, test: te } = stratifiedSplit(rows, 0.2, 1130)
  const model = train(
    tr.map((r) => r.x),
    tr.map((r) => r.y),
  )

  it('splits 80/20 without losing rows', () => {
    expect(tr.length + te.length).toBe(300)
    expect(te.length).toBeGreaterThanOrEqual(55)
    expect(te.length).toBeLessThanOrEqual(65)
  })

  it('is deterministic', () => {
    const again = train(
      tr.map((r) => r.x),
      tr.map((r) => r.y),
    )
    expect(again.W).toEqual(model.W)
  })

  it('returns probabilities that sum to 1', () => {
    const p = predictProba(model, te[0].x)
    expect(p).toHaveLength(LABELS.length)
    expect(p.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10)
  })

  it('learns a useful but imperfect pattern on held-out data', () => {
    const { accuracy, confusion } = evaluate(
      model,
      te.map((r) => r.x),
      te.map((r) => r.y),
    )
    expect(accuracy).toBeGreaterThanOrEqual(0.65)
    expect(accuracy).toBeLessThanOrEqual(0.95)
    expect(confusion.flat().reduce((a, b) => a + b, 0)).toBe(te.length)
  })

  it('learns that more protein items push towards on-track and takeaway pushes away', () => {
    const onTrack = LABELS.indexOf('on-track')
    expect(model.W[onTrack][FEATURES.indexOf('proteinItems')]).toBeGreaterThan(0)
    expect(model.W[onTrack][FEATURES.indexOf('takeawayOrders')]).toBeLessThan(0)
  })

  it('explains a prediction as per-feature contributions for the predicted class', () => {
    const c = contributions(model, te[0].x)
    expect(c).toHaveLength(FEATURES.length)
    expect(c[0]).toHaveProperty('feature')
    expect(c[0]).toHaveProperty('value')
  })
})
