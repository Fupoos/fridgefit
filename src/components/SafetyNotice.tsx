import { useI18n } from '../i18n'
import { HeartIcon } from './Icons'

export function SupportList() {
  const { t } = useI18n()
  const lines = [
    { phone: '1800 33 4673', text: t('support.butterfly') },
    { phone: '13 11 14', text: t('support.lifeline') },
    { phone: '000', text: t('support.emergency') },
  ]
  return (
    <ul className="support-list">
      {lines.map((s) => (
        <li key={s.phone}>
          <a href={`tel:${s.phone.replace(/\s/g, '')}`}>{s.phone}</a>
          <span className="small">{s.text}</span>
        </li>
      ))}
    </ul>
  )
}

/** Calm, non-alarming notice for safety refusals; always offers the support lines. */
export function SafetyNotice({ message, showSupport = true }: { message: string; showSupport?: boolean }) {
  const { t } = useI18n()
  return (
    <div className="notice care" role="status">
      <p>{message}</p>
      {showSupport && (
        <>
          <span className="notice-title">
            <HeartIcon width={18} height={18} />
            {t('support.title')}
          </span>
          <SupportList />
        </>
      )}
    </div>
  )
}
