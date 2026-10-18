import { useState } from 'react'
import { MeNav } from '../components/MeNav'
import { type Lang, useI18n } from '../i18n'
import { clearAll, defaultState, exportJSON } from '../lib/storage'
import { type AppApi, go } from '../state'

export function Settings({ api }: { api: AppApi }) {
  const { t, lang } = useI18n()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const adult = (api.state.profile?.age ?? 0) >= 18

  const setLang = (l: Lang) => api.update((s) => ({ ...s, settings: { ...s.settings, lang: l } }))

  const exportData = () => {
    const url = URL.createObjectURL(new Blob([exportJSON()], { type: 'application/json' }))
    const a = Object.assign(document.createElement('a'), { href: url, download: 'fridgefit-my-data.json' })
    a.click()
    URL.revokeObjectURL(url)
  }

  const deleteAll = () => {
    clearAll()
    api.setState(defaultState())
    go('/welcome')
  }

  return (
    <>
      <MeNav current="settings" />
      <div className="page-head">
        <h1>{t('settings.title')}</h1>
      </div>

      <section className="card">
        <h2>{t('settings.lang')}</h2>
        <div className="segmented" role="group" aria-label={t('settings.lang')}>
          <button aria-pressed={lang === 'en'} onClick={() => setLang('en')}>
            English
          </button>
          <button aria-pressed={lang === 'zh'} onClick={() => setLang('zh')}>
            中文
          </button>
        </div>
      </section>

      <section className="card">
        <h2>{t('settings.scan')}</h2>
        {adult ? (
          <>
            <p className="small">{t('settings.scanLead')}</p>
            <details className="fold">
              <summary>{t('settings.privacy')}</summary>
              <p className="small">{t('settings.privacyText')}</p>
            </details>
          </>
        ) : (
          <p className="small">{t('settings.under18')}</p>
        )}
      </section>

      <section className="card">
        <h2>{t('settings.data')}</h2>
        <label className="switch small">
          <input
            type="checkbox"
            checked={api.state.consent?.donate ?? false}
            onChange={(e) => api.update((s) => ({ ...s, consent: { donate: e.target.checked, decidedAt: new Date().toISOString().slice(0, 10) } }))}
          />
          <span>{t('settings.donate')}</span>
        </label>
        <div className="row">
          <button className="btn ghost small" onClick={exportData}>
            {t('settings.export')}
          </button>
          {confirmDelete ? (
            <>
              <button className="btn danger small" onClick={deleteAll}>
                {t('settings.deleteConfirm')}
              </button>
              <button className="btn ghost small" onClick={() => setConfirmDelete(false)}>
                {t('settings.keep')}
              </button>
            </>
          ) : (
            <button className="btn ghost small" onClick={() => setConfirmDelete(true)}>
              {t('settings.delete')}
            </button>
          )}
        </div>
        {confirmDelete && <p className="small">{t('settings.deleteNote')}</p>}
      </section>

      <p className="small muted">
        {t('settings.footer')}{' '}
        <a href="https://github.com/Fupoos/fridgefit" target="_blank" rel="noreferrer">
          {t('settings.source')}
        </a>
      </p>
    </>
  )
}
