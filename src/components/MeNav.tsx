export function MeNav({ current }: { current: 'profile' | 'log' | 'settings' }) {
  const items = [
    { key: 'profile', href: '#/me', label: 'Profile' },
    { key: 'log', href: '#/me/log', label: 'Check-in' },
    { key: 'settings', href: '#/me/settings', label: 'Settings' },
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
