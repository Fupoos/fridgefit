import { describe, expect, it } from 'vitest'
import { STATE_KEY, clearAll, defaultState, forgetApiKeys, loadState, saveState } from './storage'

class MemoryStorage implements Storage {
  private m = new Map<string, string>()
  get length() {
    return this.m.size
  }
  clear() {
    this.m.clear()
  }
  getItem(k: string) {
    return this.m.has(k) ? this.m.get(k)! : null
  }
  key(i: number) {
    return [...this.m.keys()][i] ?? null
  }
  removeItem(k: string) {
    this.m.delete(k)
  }
  setItem(k: string, v: string) {
    this.m.set(k, v)
  }
}

describe('storage', () => {
  it('returns the default state when nothing is saved', () => {
    expect(loadState(new MemoryStorage())).toEqual(defaultState())
  })

  it('round-trips state', () => {
    const s = new MemoryStorage()
    const state = { ...defaultState(), consent: { donate: true, decidedAt: '2026-10-18' } }
    saveState(state, s)
    expect(loadState(s)).toEqual(state)
  })

  it('falls back to defaults when saved data is corrupt or from another version', () => {
    const s = new MemoryStorage()
    s.setItem(STATE_KEY, '{not json')
    expect(loadState(s)).toEqual(defaultState())
    s.setItem(STATE_KEY, JSON.stringify({ version: 999 }))
    expect(loadState(s)).toEqual(defaultState())
  })

  it('clearAll removes everything FridgeFit stored', () => {
    const local = new MemoryStorage()
    const session = new MemoryStorage()
    saveState(defaultState(), local)
    session.setItem('fridgefit:v1:other', 'x')
    clearAll(local, session)
    expect(local.length).toBe(0)
    expect(session.length).toBe(0)
  })
})

describe('settings migration', () => {
  it('defaults to no fixed language', () => {
    expect(defaultState().settings).toEqual({ lang: null })
  })

  it('drops the model name older versions saved', () => {
    const s = new MemoryStorage()
    s.setItem(STATE_KEY, JSON.stringify({ ...defaultState(), settings: { model: 'gemini-3.8-flash', lang: 'en' } }))
    expect(loadState(s).settings).toEqual({ lang: 'en' })
  })

  it('keeps a saved language choice', () => {
    const s = new MemoryStorage()
    saveState({ ...defaultState(), settings: { lang: 'zh' } }, s)
    expect(loadState(s).settings.lang).toBe('zh')
  })
})

describe('forgetApiKeys', () => {
  it('removes API keys saved by older versions from both storages, and nothing else', () => {
    const local = new MemoryStorage()
    const session = new MemoryStorage()
    saveState(defaultState(), local)
    local.setItem('fridgefit:v1:claude-key', 'old-key-a')
    local.setItem('fridgefit:v1:gemini-key', 'old-key-b')
    session.setItem('fridgefit:v1:claude-key', 'old-key-c')
    forgetApiKeys(local, session)
    expect(local.getItem('fridgefit:v1:claude-key')).toBeNull()
    expect(local.getItem('fridgefit:v1:gemini-key')).toBeNull()
    expect(session.length).toBe(0)
    expect(local.getItem(STATE_KEY)).not.toBeNull()
  })
})
