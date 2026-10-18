import { SUPPORT } from '../lib/safety'

export function SupportList() {
  return (
    <ul className="support-list">
      {SUPPORT.map((s) => (
        <li key={s.name}>
          <a href={`tel:${s.phone.replace(/\s/g, '')}`}>{s.phone}</a> {s.name}
          <span className="muted small"> — {s.detail}</span>
        </li>
      ))}
    </ul>
  )
}

export function SafetyNotice({ message, showSupport = true }: { message: string; showSupport?: boolean }) {
  return (
    <div className="notice care" role="status">
      <p>{message}</p>
      {showSupport && <SupportList />}
    </div>
  )
}
