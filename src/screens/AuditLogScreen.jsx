import { CommonFilter } from '../components/CommonFilter'
import { Table } from '../components/Table'
import { Toolbar } from '../components/Toolbar'
import { auditLogs } from '../data/store'
import { matchesFilter } from '../services/domain'

export function AuditLogScreen({ role, filter, onFilterChange }) {
  const rows = auditLogs
    .filter((log) => matchesFilter(log, filter))
    .map((log) => [log.at, log.user, log.action, log.target])

  return (
    <div className="screen-stack">
      <Toolbar title="監査ログ" action="CSV出力" detail="設定変更イベントを企業・現場スコープで記録します。" />
      <CommonFilter role={role} filter={filter} onChange={onFilterChange} />
      <Table headers={['日時', 'ユーザー', '操作', '対象']} rows={rows} />
    </div>
  )
}
