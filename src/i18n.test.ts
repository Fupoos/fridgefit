import { describe, expect, it } from 'vitest'
import { FOODS } from './data/foods'
import { FOOD_NAMES_ZH } from './data/foodNamesZh'
import { DEMO_FRIDGES, SAMPLE_LABELS_ZH } from './data/samples'
import { DICT, translate } from './i18n'

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort()

describe('i18n dictionaries', () => {
  it('have exactly the same keys in English and Chinese', () => {
    expect(Object.keys(DICT.zh).sort()).toEqual(Object.keys(DICT.en).sort())
  })

  it('have no empty strings', () => {
    for (const lang of ['en', 'zh'] as const) {
      for (const [k, v] of Object.entries(DICT[lang])) expect(v.trim(), `${lang}:${k}`).not.toBe('')
    }
  })

  it('use the same {placeholders} in both languages', () => {
    for (const k of Object.keys(DICT.en) as (keyof typeof DICT.en)[]) {
      expect(placeholders(DICT.zh[k]), k).toEqual(placeholders(DICT.en[k]))
    }
  })

  it('fills placeholders', () => {
    expect(translate('en', 'confirm.save', { n: 10 })).toBe('Save 10 items')
    expect(translate('zh', 'confirm.save', { n: 10 })).toBe('保存 10 样')
  })
})

describe('Chinese food names', () => {
  it('exist for every food in the table', () => {
    for (const f of FOODS) expect(FOOD_NAMES_ZH[f.id], f.id).toBeTruthy()
  })

  it('exist for every label used in the sample fridges', () => {
    for (const d of DEMO_FRIDGES) {
      for (const it of [...d.predicted, ...d.actual]) expect(SAMPLE_LABELS_ZH[it.label], it.label).toBeTruthy()
    }
  })
})
