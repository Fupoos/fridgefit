import type { FridgeScan, Profile, WeeklyLog } from '../types'
import { DEFAULT_MODEL } from './claude'

/**
 * Everything FridgeFit knows lives in this browser's storage. Nothing is
 * uploaded; the "data donation" switch is a prototype of the opt-in flow.
 */
export const STATE_KEY = 'fridgefit:v1:state'
// Renamed from 'gemini-key' so an old Gemini key is never sent to Anthropic (clearAll still removes it).
export const API_KEY_KEY = 'fridgefit:v1:claude-key'
const VERSION = 1

export interface AppState {
  version: typeof VERSION
  consent: { donate: boolean; decidedAt: string } | null
  profile: Profile | null
  scans: FridgeScan[]
  /** A scan waiting for the user to check it on the Confirm screen. */
  draft: FridgeScan | null
  logs: WeeklyLog[]
  /** lang null = follow the browser language. */
  settings: { model: string; lang: 'en' | 'zh' | null }
}

export function defaultState(): AppState {
  return { version: VERSION, consent: null, profile: null, scans: [], draft: null, logs: [], settings: { model: DEFAULT_MODEL, lang: null } }
}

function safeLocal(): Storage | null {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

function safeSession(): Storage | null {
  try {
    return globalThis.sessionStorage ?? null
  } catch {
    return null
  }
}

export function loadState(local: Storage | null = safeLocal()): AppState {
  try {
    const raw = local?.getItem(STATE_KEY)
    if (!raw) return defaultState()
    const parsed = JSON.parse(raw) as Partial<AppState>
    if (parsed.version !== VERSION) return defaultState()
    const state = { ...defaultState(), ...parsed } as AppState
    // Older builds used Gemini; its model names do not exist on the Claude API.
    const model = typeof state.settings?.model === 'string' && state.settings.model.startsWith('claude') ? state.settings.model : DEFAULT_MODEL
    const lang = state.settings?.lang === 'en' || state.settings?.lang === 'zh' ? state.settings.lang : null
    return { ...state, settings: { model, lang } }
  } catch {
    return defaultState()
  }
}

export function saveState(state: AppState, local: Storage | null = safeLocal()): void {
  try {
    local?.setItem(STATE_KEY, JSON.stringify(state))
  } catch {
    /* storage full or blocked: the app keeps working in memory */
  }
}

export function loadKey(local: Storage | null = safeLocal(), session: Storage | null = safeSession()): { key: string; remember: boolean } {
  try {
    const s = session?.getItem(API_KEY_KEY)
    if (s) return { key: s, remember: false }
    const l = local?.getItem(API_KEY_KEY)
    if (l) return { key: l, remember: true }
  } catch {
    /* fall through */
  }
  return { key: '', remember: false }
}

export function saveKey(
  key: string,
  remember: boolean,
  local: Storage | null = safeLocal(),
  session: Storage | null = safeSession(),
): void {
  try {
    local?.removeItem(API_KEY_KEY)
    session?.removeItem(API_KEY_KEY)
    if (!key.trim()) return
    ;(remember ? local : session)?.setItem(API_KEY_KEY, key.trim())
  } catch {
    /* ignore */
  }
}

/** The user's data as JSON — deliberately excludes the API key. */
export function exportJSON(local: Storage | null = safeLocal()): string {
  return JSON.stringify(loadState(local), null, 2)
}

export function clearAll(local: Storage | null = safeLocal(), session: Storage | null = safeSession()): void {
  for (const store of [local, session]) {
    if (!store) continue
    try {
      const keys = Array.from({ length: store.length }, (_, i) => store.key(i)).filter((k): k is string => !!k?.startsWith('fridgefit:'))
      for (const k of keys) store.removeItem(k)
    } catch {
      /* ignore */
    }
  }
}
