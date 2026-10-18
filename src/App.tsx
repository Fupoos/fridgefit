import { useEffect, useMemo } from 'react'
import { BasketIcon, FridgeIcon, LeafMark, PersonIcon, PlateIcon, TrendIcon } from './components/Icons'
import { I18nContext, detectLang, makeI18n } from './i18n'
import { Confirm } from './pages/Confirm'
import { Fridge } from './pages/Fridge'
import { Log } from './pages/Log'
import { Plan } from './pages/Plan'
import { Predict } from './pages/Predict'
import { Profile } from './pages/Profile'
import { Settings } from './pages/Settings'
import { Shop } from './pages/Shop'
import { Welcome } from './pages/Welcome'
import { useAppState, useHashRoute } from './state'

const TABS = [
  { href: '#/fridge', match: '/fridge', key: 'tab.fridge', Icon: FridgeIcon },
  { href: '#/plan', match: '/plan', key: 'tab.plan', Icon: PlateIcon },
  { href: '#/shop', match: '/shop', key: 'tab.shop', Icon: BasketIcon },
  { href: '#/predict', match: '/predict', key: 'tab.predict', Icon: TrendIcon },
  { href: '#/me', match: '/me', key: 'tab.me', Icon: PersonIcon },
] as const

export default function App() {
  const api = useAppState()
  const route = useHashRoute()
  const lang = api.state.settings.lang ?? detectLang()
  const i18n = useMemo(() => makeI18n(lang), [lang])

  useEffect(() => {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en-AU'
  }, [lang])

  const toggleLang = () => api.update((s) => ({ ...s, settings: { ...s.settings, lang: lang === 'zh' ? 'en' : 'zh' } }))

  const firstRun = !api.state.consent
  const needsProfile = !firstRun && !api.state.profile

  let page
  if (firstRun || route === '/welcome') page = <Welcome api={api} />
  else if (needsProfile || route === '/me' || route === '/me/profile') page = <Profile api={api} />
  else if (route === '/fridge/confirm') page = <Confirm api={api} />
  else if (route.startsWith('/plan')) page = <Plan api={api} />
  else if (route.startsWith('/shop')) page = <Shop api={api} />
  else if (route.startsWith('/predict')) page = <Predict api={api} />
  else if (route === '/me/log') page = <Log api={api} />
  else if (route === '/me/settings') page = <Settings api={api} />
  else page = <Fridge api={api} />

  const showTabs = !firstRun && !needsProfile

  return (
    <I18nContext.Provider value={i18n}>
      <div className="app">
        <header className="topbar">
          <a className="brand" href="#/fridge">
            <LeafMark width={22} height={22} />
            FridgeFit
          </a>
          <div className="topbar-right">
            {api.state.scans.length > 0 && <span>{i18n.t('app.scans', { n: api.state.scans.length })}</span>}
            <button className="lang-btn" onClick={toggleLang} aria-label={lang === 'zh' ? 'Switch to English' : '切换到中文'}>
              {i18n.t('lang.other')}
            </button>
          </div>
        </header>
        <main className="page">{page}</main>
        {showTabs && (
          <nav className="tabbar" aria-label="Main">
            {TABS.map(({ href, match, key, Icon }) => (
              <a key={href} href={href} aria-current={route.startsWith(match) ? 'page' : undefined}>
                <Icon />
                {i18n.t(key)}
              </a>
            ))}
          </nav>
        )}
      </div>
    </I18nContext.Provider>
  )
}
