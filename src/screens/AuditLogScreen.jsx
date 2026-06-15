import { CommonFilter } from '../components/CommonFilter'
import { Table } from '../components/Table'
import { Toolbar } from '../components/Toolbar'
import { auditLogs } from '../data/store'
import { matchesFilter } from '../services/domain'

function formatAuditDateTime(value) {
  if (!value) return '-'
  const normalizedValue = typeof value === 'string' ? value.replace(' ', 'T') : value
  const date = new Date(normalizedValue)
  if (Number.isNaN(date.getTime())) return value

  const parts = new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const part = (type) => parts.find((item) => item.type === type)?.value ?? ''

  return `${part('year')}:${part('month')}:${part('day')} ${part('hour')}:${part('minute')}:${part('second')}`
}

export function AuditLogScreen({ role, filter, onFilterChange }) {
  const rows = auditLogs
    .filter((log) => matchesFilter(log, filter))
    .map((log) => [formatAuditDateTime(log.at), log.user, log.action, log.target])

  return (
    <div className="screen-stack">
      <Toolbar title="監査ログ" action="CSV出力" detail="設定変更イベントを企業・現場スコープで記録します。" />
      <CommonFilter role={role} filter={filter} onChange={onFilterChange} />
      <Table headers={['日時', 'ユーザー', '操作', '対象']} rows={rows} />
    </div>
  )
}
