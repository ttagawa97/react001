import { getCompany, getLatestValues, getSite, getThresholdStatus } from '../services/domain'
import { StatusBadge } from './Badges'
import { Table } from './Table'

const deviceTableColumnWidths = ['12%', '12%', '17%', '12%', '14%', '15%', '9%', '9%']

function formatReceivedAt(value) {
  if (!value || value === '-') return '-'

  const normalizedValue = typeof value === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(value)
    ? value.replace(' ', 'T')
    : value
  const date = new Date(normalizedValue)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).format(date)
}

export function DeviceTable({ rows, selectedDeviceId, onSelectDevice, onOpenDevice }) {
  return (
    <Table
      className="device-table-panel"
      columnWidths={deviceTableColumnWidths}
      headers={['企業', '現場', 'デバイス名', 'デバイスID', '最新値', '最終受信', '通信状態', '閾値状態']}
      rows={rows.map((device) => ({
        id: device.id,
        selected: device.id === selectedDeviceId,
        onClick: onSelectDevice ? () => onSelectDevice(device.id) : undefined,
        onDoubleClick: onOpenDevice ? () => onOpenDevice(device) : undefined,
        cells: [
          getCompany(device.companyId)?.name,
          getSite(device.siteId)?.name,
          device.name,
          device.id,
          getLatestValues(device),
          formatReceivedAt(device.latestReceivedAt),
          <StatusBadge key={device.id} status={device.status} />,
          getThresholdStatus(device.columns, device.latestValues, true),
        ],
      }))}
    />
  )
}
