import { useState } from 'react'
import { FridgeArt } from '../components/FridgeArt'
import { CameraIcon, ImageIcon } from '../components/Icons'
import { FOODS } from '../data/foods'
import { DEMO_FRIDGES, type DemoFridge, SAMPLE_LABELS_ZH } from '../data/samples'
import { type Key, useI18n } from '../i18n'
import { ClaudeError, recognizeFridge } from '../lib/claude'
import { UNREADABLE_PHOTO, prepareImage } from '../lib/image'
import { setPreview } from '../lib/preview'
import { loadKey } from '../lib/storage'
import { type AppApi, go } from '../state'
import type { FridgeItem } from '../types'

const FOOD_IDS = FOODS.map((f) => f.id)

export function Fridge({ api }: { api: AppApi }) {
  const { t, lang, locale } = useI18n()
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [errorDetail, setErrorDetail] = useState<string | null>(null)
  const key = loadKey().key
  const adult = (api.state.profile?.age ?? 0) >= 18
  const canScan = Boolean(key) && adult
  const last = api.latestScan

  const localise = (items: FridgeItem[]) => (lang === 'zh' ? items.map((i) => ({ ...i, label: SAMPLE_LABELS_ZH[i.label] ?? i.label })) : items)

  const useSample = (d: DemoFridge) => {
    setPreview(null)
    const predicted = localise(d.predicted)
    api.update((s) => ({
      ...s,
      draft: { id: `demo-${d.id}-${Date.now()}`, date: new Date().toISOString().slice(0, 10), source: 'demo', sampleId: d.id, predicted, confirmed: predicted },
    }))
    go('/fridge/confirm')
  }

  const onPhoto = async (file: File | undefined) => {
    if (!file) return
    setError(null)
    setErrorDetail(null)
    setBusy(t('fridge.busyShrink'))
    try {
      const img = await prepareImage(file)
      setPreview(`data:${img.mimeType};base64,${img.base64}`)
      setBusy(t('fridge.busyRead'))
      const items = await recognizeFridge(img.base64, img.mimeType, FOOD_IDS, { apiKey: key, model: api.state.settings.model })
      api.update((s) => ({
        ...s,
        draft: { id: `scan-${Date.now()}`, date: new Date().toISOString().slice(0, 10), source: 'claude', predicted: items, confirmed: items },
      }))
      go('/fridge/confirm')
    } catch (e) {
      if (e instanceof ClaudeError) {
        setError(t(`err.${e.kind}` as Key))
        setErrorDetail(e.detail ?? null)
      }
      else if (e instanceof Error && e.message === UNREADABLE_PHOTO) setError(t('err.unreadable-photo'))
      else setError(t('err.network'))
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      <div className="page-head">
        <h1>{t('fridge.title')}</h1>
        <p className="small">{t('fridge.lead')}</p>
      </div>

      <div className="photo-drop">
        <label aria-disabled={!canScan}>
          <CameraIcon width={30} height={30} />
          {t('fridge.take')}
          <input type="file" accept="image/*" capture="environment" disabled={!canScan || !!busy} onChange={(e) => onPhoto(e.target.files?.[0])} />
        </label>
        <label className="secondary" aria-disabled={!canScan}>
          <ImageIcon width={30} height={30} />
          {t('fridge.choose')}
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
          {errorDetail && <p className="small muted">{errorDetail}</p>}
          <p className="small">{t('err.tryDemo')}</p>
        </div>
      )}
      {!canScan && (
        <p className="small muted">
          {adult ? (
            <>
              {t('fridge.needKey')} <a href="#/me/settings">{t('fridge.addKey')}</a>
            </>
          ) : (
            t('fridge.under18')
          )}
        </p>
      )}

      <section className="stack">
        <h2>{t('fridge.samples')}</h2>
        <div className="sample-grid">
          {DEMO_FRIDGES.map((d) => (
            <button key={d.id} className="sample" onClick={() => useSample(d)}>
              <FridgeArt items={d.actual} title={t(`sample.${d.id}` as Key)} />
              {t(`sample.${d.id}` as Key)}
            </button>
          ))}
        </div>
      </section>

      {last && (
        <section className="card">
          <div className="card-head">
            <span>
              {t('fridge.last', {
                date: new Date(last.date + 'T00:00').toLocaleDateString(locale, { day: 'numeric', month: 'short' }),
                n: last.confirmed.length,
              })}
            </span>
            <a className="btn small" href="#/plan">
              {t('fridge.seePlan')}
            </a>
          </div>
        </section>
      )}
    </>
  )
}
