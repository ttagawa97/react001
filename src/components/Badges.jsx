import { statusLabels } from '../data/constants'

export function StatusBadge({ status }) {
  return <span className={`status ${status}`}>{statusLabels[status]}</span>
}

export function StatusPill({ tone, children }) {
  return <span className={`status-pill ${tone}`}>{children}</span>
}
