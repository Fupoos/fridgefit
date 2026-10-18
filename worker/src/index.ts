import { DurableObject } from 'cloudflare:workers'
import { type DailyBudget, handle } from './handler'

/** Counts paid Claude calls per UTC day in one place, so the daily cap holds across all Cloudflare locations. */
export class ScanBudget extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)
    ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS days (day TEXT PRIMARY KEY, n INTEGER NOT NULL)')
  }

  async take(day: string, limit: number): Promise<boolean> {
    const sql = this.ctx.storage.sql
    const row = sql.exec<{ n: number }>('SELECT n FROM days WHERE day = ?', day).toArray()[0]
    if ((row?.n ?? 0) >= limit) return false
    sql.exec('INSERT INTO days (day, n) VALUES (?, 1) ON CONFLICT(day) DO UPDATE SET n = n + 1', day)
    sql.exec('DELETE FROM days WHERE day < ?', day)
    return true
  }
}

export default {
  async fetch(request, env): Promise<Response> {
    const stub = env.BUDGET.getByName('daily')
    const budget: DailyBudget = { take: (day, limit) => stub.take(day, limit) }
    return handle(request, env, { budget })
  },
} satisfies ExportedHandler<Env>
