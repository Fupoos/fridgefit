import { BasketIcon, FridgeIcon, LeafMark, PersonIcon, PlateIcon, TrendIcon } from './components/Icons'
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
  { href: '#/fridge', match: '/fridge', label: 'Fridge', Icon: FridgeIcon },
  { href: '#/plan', match: '/plan', label: 'Plan', Icon: PlateIcon },
  { href: '#/shop', match: '/shop', label: 'Shop', Icon: BasketIcon },
  { href: '#/predict', match: '/predict', label: 'Predict', Icon: TrendIcon },
  { href: '#/me', match: '/me', label: 'Me', Icon: PersonIcon },
]

export default function App() {
  const api = useAppState()
  const route = useHashRoute()

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
    <div className="app">
      <header className="topbar">
        <a className="brand" href="#/fridge">
          <LeafMark width={22} height={22} />
          FridgeFit
        </a>
        {api.state.scans.length > 0 && (
          <span>
            {api.state.scans.length} scan{api.state.scans.length === 1 ? '' : 's'} saved on this phone
          </span>
        )}
      </header>
      <main className="page">{page}</main>
      {showTabs && (
        <nav className="tabbar" aria-label="Main">
          {TABS.map(({ href, match, label, Icon }) => (
            <a key={href} href={href} aria-current={route.startsWith(match) ? 'page' : undefined}>
              <Icon />
              {label}
            </a>
          ))}
        </nav>
      )}
    </div>
  )
}
