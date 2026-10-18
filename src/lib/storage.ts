import type { FridgeScan, Profile, WeeklyLog } from '../types'

/**
 * Everything FridgeFit knows lives in this browser's storage. Nothing is
 * uploaded; the "data donation" switch is a prototype of the opt-in flow.
 */
export const STATE_KEY = 'fridgefit:v1:state'
/** Where older versions kept a user's own API key. Scanning now goes through our server, so these are removed on start. */
const OLD_API_KEY_KEYS = ['fridgefit:v1:claude-key', 'fridgefit:v1:gemini-key']
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
  settings: { lang: 'en' | 'zh' | null }
}

export function defaultState(): AppState {
  return { version: VERSION, consent: null, profile: null, scans: [], draft: null, logs: [], settings: { lang: null } }
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
    // Rebuilt rather than spread, so settings older versions saved (such as a model name) are dropped.
    const lang = state.settings?.lang === 'en' || state.settings?.lang === 'zh' ? state.settings.lang : null
    return { ...state, settings: { lang } }
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

export function forgetApiKeys(local: Storage | null = safeLocal(), session: Storage | null = safeSession()): void {
  for (const store of [local, session]) {
    try {
      for (const k of OLD_API_KEY_KEYS) store?.removeItem(k)
    } catch {
      /* ignore */
    }
  }
}

/** The user's data as JSON. */
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
