import { useI18n } from '../i18n'

export function MeNav({ current }: { current: 'profile' | 'log' | 'settings' }) {
  const { t } = useI18n()
  const items = [
    { key: 'profile', href: '#/me', label: t('me.profile') },
    { key: 'log', href: '#/me/log', label: t('me.log') },
    { key: 'settings', href: '#/me/settings', label: t('me.settings') },
  ] as const
  return (
    <nav className="segmented" aria-label="Me">
      {items.map((i) => (
        <a key={i.key} href={i.href} aria-current={current === i.key ? 'page' : undefined}>
          {i.label}
        </a>
      ))}
    </nav>
  )
}
