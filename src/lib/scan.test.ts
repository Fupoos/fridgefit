import { describe, expect, it } from 'vitest'
import { ScanError, recognizeFridge } from './scan'

const URL_ = 'https://scan.example.workers.dev/scan'

function fakeFetch(res: { status: number; body: unknown } | Error) {
  const calls: { url: string; init: RequestInit }[] = []
  const impl = async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} })
    if (res instanceof Error) throw res
    return new Response(typeof res.body === 'string' ? res.body : JSON.stringify(res.body), { status: res.status })
  }
  return { impl: impl as typeof fetch, calls }
}

describe('recognizeFridge (via the scan server)', () => {
  it('posts only the photo and its type to the scan server', async () => {
    const f = fakeFetch({ status: 200, body: { items: [] } })
    await recognizeFridge('AAAA', 'image/jpeg', { endpoint: URL_, fetchImpl: f.impl })
    expect(f.calls[0].url).toBe(URL_)
    expect(f.calls[0].init.method).toBe('POST')
    expect(JSON.parse(String(f.calls[0].init.body))).toEqual({ image: 'AAAA', mediaType: 'image/jpeg' })
  })

  it('sends no API key header', async () => {
    const f = fakeFetch({ status: 200, body: { items: [] } })
    await recognizeFridge('AAAA', 'image/jpeg', { endpoint: URL_, fetchImpl: f.impl })
    const headers = new Headers(f.calls[0].init.headers)
    expect(headers.get('x-api-key')).toBeNull()
    expect(headers.get('authorization')).toBeNull()
  })

  it('returns the items, re-checked against the local food list', async () => {
    const f = fakeFetch({ status: 200, body: { items: [{ foodId: 'eggs', label: 'Eggs', grams: 600 }, { foodId: 'unicorn', label: 'Mystery', grams: 9999 }] } })
    const items = await recognizeFridge('AAAA', 'image/jpeg', { endpoint: URL_, fetchImpl: f.impl })
    expect(items).toEqual([
      { foodId: 'eggs', label: 'Eggs', grams: 600, useWithinDays: null },
      { foodId: 'other', label: 'Mystery', grams: 5000, useWithinDays: null },
    ])
  })

  it.each([
    ['busy', 429],
    ['daily-limit', 429],
    ['too-large', 413],
    ['refused', 422],
    ['malformed', 422],
  ])('passes the server’s "%s" error through', async (code, status) => {
    const f = fakeFetch({ status, body: { error: code } })
    await expect(recognizeFridge('AAAA', 'image/jpeg', { endpoint: URL_, fetchImpl: f.impl })).rejects.toMatchObject({ kind: code })
  })

  it('reports other server errors as "server" with the detail kept', async () => {
    const f = fakeFetch({ status: 502, body: { error: 'server', detail: '400 Your credit balance is too low' } })
    const err = await recognizeFridge('AAAA', 'image/jpeg', { endpoint: URL_, fetchImpl: f.impl }).catch((e) => e)
    expect(err).toBeInstanceOf(ScanError)
    expect(err.kind).toBe('server')
    expect(err.detail).toContain('credit balance')
  })

  it('reports a non-JSON error page as "server"', async () => {
    const f = fakeFetch({ status: 500, body: '<html>oops</html>' })
    await expect(recognizeFridge('AAAA', 'image/jpeg', { endpoint: URL_, fetchImpl: f.impl })).rejects.toMatchObject({ kind: 'server' })
  })

  it('reports a failed connection as "network"', async () => {
    const f = fakeFetch(new TypeError('Failed to fetch'))
    await expect(recognizeFridge('AAAA', 'image/jpeg', { endpoint: URL_, fetchImpl: f.impl })).rejects.toMatchObject({ kind: 'network' })
  })

  it('reports a 200 without an items list as "malformed"', async () => {
    const f = fakeFetch({ status: 200, body: { nope: true } })
    await expect(recognizeFridge('AAAA', 'image/jpeg', { endpoint: URL_, fetchImpl: f.impl })).rejects.toMatchObject({ kind: 'malformed' })
  })

  it('does not call anything when no scan server is configured', async () => {
    const f = fakeFetch({ status: 200, body: { items: [] } })
    await expect(recognizeFridge('AAAA', 'image/jpeg', { endpoint: '', fetchImpl: f.impl })).rejects.toMatchObject({ kind: 'unavailable' })
    expect(f.calls).toHaveLength(0)
  })
})
