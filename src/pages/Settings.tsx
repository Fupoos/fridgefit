import { useState } from 'react'
import { MeNav } from '../components/MeNav'
import { type Key, type Lang, useI18n } from '../i18n'
import { ClaudeError, DEFAULT_MODEL, testKey } from '../lib/claude'
import { clearAll, defaultState, exportJSON, loadKey, saveKey } from '../lib/storage'
import { type AppApi, go } from '../state'

export function Settings({ api }: { api: AppApi }) {
  const { t, lang } = useI18n()
  const stored = loadKey()
  const [key, setKey] = useState(stored.key)
  const [remember, setRemember] = useState(stored.remember)
  const [show, setShow] = useState(false)
  const [model, setModel] = useState(api.state.settings.model)
  const [status, setStatus] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const adult = (api.state.profile?.age ?? 0) >= 18

  const setLang = (l: Lang) => api.update((s) => ({ ...s, settings: { ...s.settings, lang: l } }))

  const saveAi = () => {
    saveKey(key, remember)
    api.update((s) => ({ ...s, settings: { ...s.settings, model: model.trim() || DEFAULT_MODEL } }))
    setStatus(key.trim() ? t('settings.saved') : t('settings.removed'))
  }

  const check = async () => {
    setStatus(t('settings.checking'))
    try {
      await testKey({ apiKey: key, model: model.trim() || DEFAULT_MODEL })
      setStatus(t('settings.works'))
    } catch (e) {
      setStatus(e instanceof ClaudeError ? `${t(`err.${e.kind}` as Key)}${e.detail ? ` (${e.detail})` : ''}` : t('err.network'))
    }
  }

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
        <h2>{t('settings.claude')}</h2>
        {adult ? (
          <>
            <p className="small muted">{t('settings.claudeLead')}</p>
            <label className="field">
              {t('settings.key')}
              <div className="row" style={{ flexWrap: 'nowrap' }}>
                <input
                  className="inline"
                  type={show ? 'text' : 'password'}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="sk-ant-…"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                />
                <button type="button" className="btn ghost small" onClick={() => setShow((v) => !v)}>
                  {show ? t('settings.hide') : t('settings.show')}
                </button>
              </div>
            </label>
            <label className="switch small">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              <span>{t('settings.remember')}</span>
            </label>
            <div className="row">
              <button className="btn small" onClick={saveAi}>
                {t('settings.save')}
              </button>
              <button className="btn ghost small" onClick={check} disabled={!key.trim()}>
                {t('settings.test')}
              </button>
            </div>
            {status && (
              <p className="small" role="status">
                {status}
              </p>
            )}
            <p className="small">
              {t('settings.maxCredit')}{' '}
              <a href="https://platform.claude.com/settings/keys" target="_blank" rel="noreferrer">
                {t('settings.console')}
              </a>
            </p>
            <details className="fold">
              <summary>{t('settings.privacy')}</summary>
              <div className="stack">
                <p className="small">{t('settings.privacyText')}</p>
                <label className="field">
                  {t('settings.model')}
                  <input value={model} onChange={(e) => setModel(e.target.value)} spellCheck={false} />
                  <span className="hint">{t('settings.modelHint', { model: DEFAULT_MODEL })}</span>
                </label>
              </div>
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
