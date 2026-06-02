import { CommonFilter } from '../components/CommonFilter'
import { DeviceTable } from '../components/DeviceTable'
import { Toolbar } from '../components/Toolbar'
import { devices } from '../data/store'
import { matchesFilter } from '../services/domain'

export function DevicesScreen({ role, filter, onFilterChange, selectedDeviceId, onSelectDevice, onNavigate }) {
  const filteredDevices = devices.filter((device) => matchesFilter(device, filter))

  return (
    <div className="screen-stack">
      <Toolbar title="現場別・デバイス別の最新値" action="更新" detail="企業・現場・デバイスの共通絞り込みで表示範囲を制御します。" />
      <CommonFilter role={role} filter={filter} onChange={onFilterChange} />
      <DeviceTable
        rows={filteredDevices}
        selectedDeviceId={selectedDeviceId}
        onSelectDevice={onSelectDevice}
        onOpenDevice={(device) => {
          onSelectDevice(device.id)
          onFilterChange({ companyId: device.companyId, siteId: device.siteId, deviceId: device.id })
          onNavigate('device_graph')
        }}
      />
    </div>
  )
}
