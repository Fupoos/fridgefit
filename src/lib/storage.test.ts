import { describe, expect, it } from 'vitest'
import { STATE_KEY, clearAll, defaultState, exportJSON, loadKey, loadState, saveKey, saveState } from './storage'

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

  it('keeps the API key out of exports', () => {
    const local = new MemoryStorage()
    const session = new MemoryStorage()
    saveState(defaultState(), local)
    saveKey('secret-key', true, local, session)
    expect(exportJSON(local)).not.toContain('secret-key')
  })

  it('stores a session-only key in session storage', () => {
    const local = new MemoryStorage()
    const session = new MemoryStorage()
    saveKey('k1', false, local, session)
    expect(loadKey(local, session)).toEqual({ key: 'k1', remember: false })
    expect(local.length).toBe(0)
  })

  it('clearAll removes the state and the key', () => {
    const local = new MemoryStorage()
    const session = new MemoryStorage()
    saveState(defaultState(), local)
    saveKey('k', true, local, session)
    clearAll(local, session)
    expect(local.length).toBe(0)
    expect(session.length).toBe(0)
  })
})

describe('settings migration', () => {
  it('defaults to Claude Opus 5.5 and no fixed language', () => {
    expect(defaultState().settings).toEqual({ model: 'claude-opus-5-5', lang: null })
  })

  it('replaces a model name saved by the old Gemini version', () => {
    const s = new MemoryStorage()
    s.setItem(STATE_KEY, JSON.stringify({ ...defaultState(), settings: { model: 'gemini-3.8-flash' } }))
    expect(loadState(s).settings).toEqual({ model: 'claude-opus-5-5', lang: null })
  })

  it('keeps a saved language choice', () => {
    const s = new MemoryStorage()
    saveState({ ...defaultState(), settings: { model: 'claude-opus-5-5', lang: 'zh' } }, s)
    expect(loadState(s).settings.lang).toBe('zh')
  })
})
