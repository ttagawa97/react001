import { getDisplayValue } from '../services/domain'
import { Table } from './Table'

function formatTimestamp(timestamp) {
  if (!timestamp) return '-'
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return timestamp
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date)
}

export function TimeSeriesDataTable({ columns }) {
  const rows = columns
    .flatMap((column) => column.values.map((rawValue, index) => ({
      id: `${column.key}-${column.timestamps?.[index] ?? 'no-timestamp'}-${index}`,
      timestamp: column.timestamps?.[index],
      cells: [
        formatTimestamp(column.timestamps?.[index]),
        `${column.label} (${column.key})`,
        getDisplayValue(column, rawValue),
        rawValue,
        column.unit || '-',
        formatTimestamp(column.serverTimestamps?.[index]),
      ],
    })))
    .sort((left, right) => {
      const leftTime = new Date(left.timestamp).getTime()
      const rightTime = new Date(right.timestamp).getTime()
      return (Number.isNaN(rightTime) ? 0 : rightTime) - (Number.isNaN(leftTime) ? 0 : leftTime)
    })

  return (
    <Table
      className="time-series-table"
      headers={['デバイス日時', 'カラム', '表示値', '受信生値', '単位', '受信日時']}
      rows={rows}
      columnWidths={['19%', '22%', '14%', '14%', '12%', '19%']}
    />
  )
}
