import { useState } from 'react'
import { FridgeArt } from '../components/FridgeArt'
import { DEMO_FRIDGES } from '../data/samples'
import { useI18n } from '../i18n'
import { type AppApi, go } from '../state'

export function Welcome({ api }: { api: AppApi }) {
  const { t } = useI18n()
  const [donate, setDonate] = useState(api.state.consent?.donate ?? false)

  const start = () => {
    api.update((s) => ({ ...s, consent: { donate, decidedAt: new Date().toISOString().slice(0, 10) } }))
    go(api.state.profile ? '/fridge' : '/me')
  }

  return (
    <>
      <div className="welcome-art">
        <FridgeArt items={DEMO_FRIDGES[0].actual} title="FridgeFit" />
      </div>
      <div className="page-head">
        <h1>{t('welcome.title')}</h1>
        <p>{t('welcome.lead')}</p>
      </div>

      <button className="btn block" onClick={start}>
        {t('welcome.start')}
      </button>

      <label className="switch small">
        <input type="checkbox" checked={donate} onChange={(e) => setDonate(e.target.checked)} />
        <span>
          {t('welcome.donate')}
          <br />
          <span className="muted">{t('welcome.donateNote')}</span>
        </span>
      </label>

      <details className="fold">
        <summary>{t('welcome.privacyTitle')}</summary>
        <div className="prose">
          <ul>
            <li>{t('welcome.privacy1')}</li>
            <li>{t('welcome.privacy2')}</li>
            <li>{t('welcome.privacy3')}</li>
          </ul>
        </div>
      </details>

      <p className="small muted">{t('welcome.disclaimer')} Butterfly 1800 33 4673.</p>
    </>
  )
}
