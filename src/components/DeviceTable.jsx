import { getCompany, getLatestValues, getSite } from '../services/domain'
import { StatusBadge } from './Badges'
import { Table } from './Table'

export function DeviceTable({ rows, selectedDeviceId, onSelectDevice, onOpenDevice }) {
  return (
    <Table
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
          device.latestReceivedAt,
          <StatusBadge key={device.id} status={device.status} />,
          device.alert,
        ],
      }))}
    />
  )
}
