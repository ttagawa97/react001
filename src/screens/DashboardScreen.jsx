import { CommonFilter } from '../components/CommonFilter'
import { DeviceTable } from '../components/DeviceTable'
import { PanelHeader } from '../components/Toolbar'
import { graphPoints } from '../data/constants'
import { devices, sites } from '../data/store'
import { matchesFilter } from '../services/domain'

export function DashboardScreen({ role, filter, onFilterChange }) {
  const filteredDevices = devices.filter((device) => matchesFilter(device, filter))
  const filteredSites = sites.filter((site) => (
    (filter.companyId === 'all' || site.companyId === filter.companyId) &&
    (filter.siteId === 'all' || site.id === filter.siteId)
  ))
  const normalDevices = filteredDevices.filter((device) => device.status === 'online').length
  const disconnectedDevices = filteredDevices.filter((device) => device.status === 'offline').length
  const alertDevices = filteredDevices.filter((device) => device.alert !== '正常').length
  const metrics = [
    { label: '現場数', value: filteredSites.length, detail: '現在の権限・絞り込み範囲' },
    { label: '総デバイス数', value: filteredDevices.length, detail: '現場配下の設置端末' },
    { label: '正常台数', value: normalDevices, detail: '最新値が正常範囲内' },
    { label: '通信停止台数', value: disconnectedDevices, detail: '推定受信間隔の超過で検知' },
    { label: 'アラート台数', value: alertDevices, detail: '閾値または通信状態' },
  ]

  return (
    <div className="screen-stack">
      <CommonFilter role={role} filter={filter} onChange={onFilterChange} />
      <section className="metric-grid">
        {metrics.map((metric) => (
          <article className="metric-card" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <p>{metric.detail}</p>
          </article>
        ))}
      </section>

      <section className="content-grid">
        <article className="panel wide">
          <PanelHeader title="時系列グラフ" detail="表示期間に応じて parsed_data / 1min / 1hour を切替" />
          <div className="chart" aria-label="時系列グラフのモック">
            {graphPoints.map((point, index) => (
              <span
                className="chart-bar"
                key={`${point}-${index}`}
                style={{ height: `${point}%` }}
                title={`${index + 1}: ${point}`}
              />
            ))}
          </div>
        </article>

        <article className="panel">
          <PanelHeader title="権限制御" detail="フィルタはログインユーザー範囲に固定" />
          <ol className="hierarchy-list">
            <li>企業</li>
            <li>現場</li>
            <li>デバイス</li>
            <li>データ項目</li>
            <li>閾値</li>
          </ol>
        </article>
      </section>

      <DeviceTable rows={filteredDevices.slice(0, 3)} />
    </div>
  )
}
