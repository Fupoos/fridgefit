import { useCallback, useEffect, useMemo, useState } from 'react'
import { FOOD_MAP } from './data/foods'
import { computeTargets } from './lib/nutrition'
import { planLocal } from './lib/planner'
import { checkGoal } from './lib/safety'
import { type AppState, loadState, saveState } from './lib/storage'

export function useAppState() {
  const [state, setState] = useState<AppState>(() => loadState())

  useEffect(() => saveState(state), [state])

  const update = useCallback((fn: (s: AppState) => AppState) => setState((s) => fn(s)), [])

  const derived = useMemo(() => {
    const profile = state.profile
    const targets = profile ? computeTargets(profile) : null
    const goalCheck = profile ? checkGoal(profile) : null
    const latestScan = state.scans.at(-1) ?? null
    const latestLog = [...state.logs].sort((a, b) => a.weekStart.localeCompare(b.weekStart)).at(-1) ?? null
    const plan = profile && targets && latestScan ? planLocal(latestScan.confirmed, targets, profile, FOOD_MAP) : null
    return { targets, goalCheck, latestScan, latestLog, plan }
  }, [state])

  return { state, update, setState, ...derived }
}

export type AppApi = ReturnType<typeof useAppState>

export function useHashRoute(): string {
  const read = () => window.location.hash.replace(/^#/, '') || '/fridge'
  const [route, setRoute] = useState(read)
  useEffect(() => {
    const onChange = () => {
      setRoute(read())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}

export function go(route: string) {
  window.location.hash = route
}
