import { useState } from 'react'
import { FridgeArt } from '../components/FridgeArt'
import { CameraIcon, ImageIcon } from '../components/Icons'
import { FOODS } from '../data/foods'
import { DEMO_FRIDGES, type DemoFridge } from '../data/samples'
import { GeminiError, recognizeFridge } from '../lib/gemini'
import { prepareImage } from '../lib/image'
import { setPreview } from '../lib/preview'
import { loadKey } from '../lib/storage'
import { type AppApi, go } from '../state'

const FOOD_IDS = FOODS.map((f) => f.id)

export function Fridge({ api }: { api: AppApi }) {
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const key = loadKey().key
  const adult = (api.state.profile?.age ?? 0) >= 18
  const canScan = Boolean(key) && adult
  const last = api.latestScan

  const useSample = (d: DemoFridge) => {
    setPreview(null)
    api.update((s) => ({
      ...s,
      draft: { id: `demo-${d.id}-${Date.now()}`, date: new Date().toISOString().slice(0, 10), source: 'demo', sampleId: d.id, predicted: d.predicted, confirmed: d.predicted },
    }))
    go('/fridge/confirm')
  }

  const onPhoto = async (file: File | undefined) => {
    if (!file) return
    setError(null)
    setBusy('Shrinking the photo and removing location data…')
    try {
      const img = await prepareImage(file)
      setPreview(`data:${img.mimeType};base64,${img.base64}`)
      setBusy('Reading your fridge…')
      const items = await recognizeFridge(img.base64, img.mimeType, FOOD_IDS, { apiKey: key, model: api.state.settings.model })
      api.update((s) => ({
        ...s,
        draft: { id: `scan-${Date.now()}`, date: new Date().toISOString().slice(0, 10), source: 'gemini', predicted: items, confirmed: items },
      }))
      go('/fridge/confirm')
    } catch (e) {
      setError(e instanceof GeminiError || e instanceof Error ? e.message : 'Something went wrong reading the photo.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      <div className="page-head">
        <h1>Scan your fridge</h1>
        <p>Take one photo with the door open. You check what the scanner found before anything is saved.</p>
      </div>

      <section className="shelf">
        <div className="photo-drop">
          <label aria-disabled={!canScan} style={canScan ? undefined : { opacity: 0.45, cursor: 'not-allowed' }}>
            <CameraIcon width={30} height={30} />
            Take a photo
            <input type="file" accept="image/*" capture="environment" disabled={!canScan || !!busy} onChange={(e) => onPhoto(e.target.files?.[0])} />
          </label>
          <label aria-disabled={!canScan} style={canScan ? undefined : { opacity: 0.45, cursor: 'not-allowed' }}>
            <ImageIcon width={30} height={30} />
            Choose a photo
            <input type="file" accept="image/*" disabled={!canScan || !!busy} onChange={(e) => onPhoto(e.target.files?.[0])} />
          </label>
        </div>
        {busy && (
          <p role="status" className="small">
            {busy}
          </p>
        )}
        {error && (
          <div className="notice care" role="alert">
            <p>{error}</p>
            <p className="small">You can still try one of the sample fridges below.</p>
          </div>
        )}
        {!canScan && (
          <p className="small muted">
            {adult ? (
              <>
                Scanning your own fridge needs a free Gemini API key. <a href="#/me/settings">Add one in Settings</a>, or try a sample fridge.
              </>
            ) : (
              <>Photo scanning uses Google Gemini, which is only for people 18 and over. You can still use the sample fridges.</>
            )}
          </p>
        )}
      </section>

      <section className="shelf">
        <div className="shelf-head">
          <h2>Or try a sample fridge</h2>
          <span className="aside">Works offline</span>
        </div>
        <div className="sample-grid">
          {DEMO_FRIDGES.map((d) => (
            <button key={d.id} className="sample" onClick={() => useSample(d)}>
              <FridgeArt items={d.actual} title={`Sample fridge: ${d.name}`} />
              <b>{d.name}</b>
              <span>{d.blurb}</span>
            </button>
          ))}
        </div>
      </section>

      {last && (
        <section className="shelf">
          <div className="shelf-head">
            <h2>Last scan</h2>
            <span className="aside">{new Date(last.date + 'T00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}</span>
          </div>
          <p>
            {last.confirmed.length} items confirmed
            {last.source === 'demo' ? ' from a sample fridge' : ''}. Your meal plan and shopping list use this scan.
          </p>
          <div className="row">
            <a className="btn" href="#/plan">
              See today's plan
            </a>
            <a className="btn ghost" href="#/shop">
              Shopping list
            </a>
          </div>
        </section>
      )}
    </>
  )
}
