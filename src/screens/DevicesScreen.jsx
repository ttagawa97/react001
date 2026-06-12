import { useState } from 'react'
import { CommonFilter } from '../components/CommonFilter'
import { DeviceTable } from '../components/DeviceTable'
import { Toolbar } from '../components/Toolbar'
import { devices } from '../data/store'
import { formatApiError, matchesFilter, refreshLatestDevices } from '../services/domain'

export function DevicesScreen({ role, filter, onFilterChange, selectedDeviceId, onSelectDevice, onNavigate, onDataChanged, onError }) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const filteredDevices = devices.filter((device) => matchesFilter(device, filter))

  async function refreshDevices() {
    setIsRefreshing(true)
    try {
      await refreshLatestDevices({
        company_id: filter.companyId,
        site_id: filter.siteId,
      })
      onDataChanged()
    } catch (error) {
      onError(formatApiError(error))
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <div className="screen-stack">
      <Toolbar
        title="現場別・デバイス別の最新値"
        action={isRefreshing ? '更新中...' : '更新'}
        detail="企業・現場の共通絞り込みで表示範囲を制御します。"
        onAction={refreshDevices}
        actionDisabled={isRefreshing}
      />
      <CommonFilter role={role} filter={filter} onChange={onFilterChange} />
      <DeviceTable
        rows={filteredDevices}
        selectedDeviceId={selectedDeviceId}
        onSelectDevice={onSelectDevice}
        onOpenDevice={(device) => {
          onSelectDevice(device.id)
          onFilterChange({ companyId: device.companyId, siteId: device.siteId })
          onNavigate('device_graph')
        }}
      />
    </div>
  )
}
