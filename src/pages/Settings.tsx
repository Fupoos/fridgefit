import { useState } from 'react'
import { MeNav } from '../components/MeNav'
import { DEFAULT_MODEL, GeminiError, testKey } from '../lib/gemini'
import { clearAll, defaultState, exportJSON, loadKey, saveKey } from '../lib/storage'
import { type AppApi, go } from '../state'

export function Settings({ api }: { api: AppApi }) {
  const stored = loadKey()
  const [key, setKey] = useState(stored.key)
  const [remember, setRemember] = useState(stored.remember)
  const [show, setShow] = useState(false)
  const [model, setModel] = useState(api.state.settings.model)
  const [status, setStatus] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const adult = (api.state.profile?.age ?? 0) >= 18

  const saveAi = () => {
    saveKey(key, remember)
    api.update((s) => ({ ...s, settings: { ...s.settings, model: model.trim() || DEFAULT_MODEL } }))
    setStatus(key.trim() ? 'Saved. Photo scanning is on.' : 'Key removed. Photo scanning is off.')
  }

  const check = async () => {
    setStatus('Checking…')
    try {
      await testKey({ apiKey: key, model: model.trim() || DEFAULT_MODEL })
      setStatus('The key works.')
    } catch (e) {
      setStatus(e instanceof GeminiError ? e.message : 'Could not check the key.')
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
        <h1>Settings</h1>
      </div>

      <section className="shelf">
        <h2>Photo scanning</h2>
        {adult ? (
          <>
            <p className="small">
              FridgeFit uses Google Gemini to recognise food. Get a free key at{' '}
              <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">
                Google AI Studio
              </a>
              . The key stays in this browser and is sent only to Google.
            </p>
            <label className="field">
              Gemini API key
              <div className="row" style={{ flexWrap: 'nowrap' }}>
                <input
                  className="inline"
                  type={show ? 'text' : 'password'}
                  autoComplete="off"
                  spellCheck={false}
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                />
                <button type="button" className="btn ghost" onClick={() => setShow((v) => !v)}>
                  {show ? 'Hide' : 'Show'}
                </button>
              </div>
            </label>
            <label className="switch">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              <span>Remember on this device (otherwise forgotten when you close the tab)</span>
            </label>
            <label className="field">
              Model
              <input value={model} onChange={(e) => setModel(e.target.value)} spellCheck={false} />
              <span className="hint">Default {DEFAULT_MODEL}. Change only if Google retires it.</span>
            </label>
            <div className="row">
              <button className="btn" onClick={saveAi}>
                Save
              </button>
              <button className="btn ghost" onClick={check} disabled={!key.trim()}>
                Test key
              </button>
            </div>
            {status && (
              <p className="small" role="status">
                {status}
              </p>
            )}
            <div className="notice">
              <p className="small">
                On Google's free tier, what you send may be used to improve Google's products and may be read by human reviewers. Only photograph
                food. Keep medication, mail and people out of the shot.
              </p>
            </div>
          </>
        ) : (
          <p className="small">Gemini is only available to people 18 and over, so photo scanning is turned off. Sample fridges still work.</p>
        )}
      </section>

      <section className="shelf">
        <h2>Your data</h2>
        <label className="switch">
          <input
            type="checkbox"
            checked={api.state.consent?.donate ?? false}
            onChange={(e) =>
              api.update((s) => ({ ...s, consent: { donate: e.target.checked, decidedAt: new Date().toISOString().slice(0, 10) } }))
            }
          />
          <span>
            Donate anonymous weekly fridge patterns to the student food study
            <br />
            <span className="muted small">Prototype: records your choice only. Nothing is sent.</span>
          </span>
        </label>
        <div className="row">
          <button className="btn ghost" onClick={exportData}>
            Export my data
          </button>
          {confirmDelete ? (
            <>
              <button className="btn danger" onClick={deleteAll}>
                Delete everything
              </button>
              <button className="btn ghost" onClick={() => setConfirmDelete(false)}>
                Keep my data
              </button>
            </>
          ) : (
            <button className="btn ghost" onClick={() => setConfirmDelete(true)}>
              Delete all data
            </button>
          )}
        </div>
        {confirmDelete && <p className="small">This removes your profile, scans, check-ins and API key from this browser. It cannot be undone.</p>}
      </section>

      <p className="small muted">
        FridgeFit is a COMU1130 student prototype. Nutrition values: USDA FoodData Central. Not medical advice.{' '}
        <a href="https://github.com/Fupoos/fridgefit" target="_blank" rel="noreferrer">
          Source code
        </a>
      </p>
    </>
  )
}
