import { useState } from 'react'
import { CommonFilter } from '../components/CommonFilter'
import { StatusBadge } from '../components/Badges'
import { FilterPanel, InputField, SelectField } from '../components/FormFields'
import { TimeSeriesPanel } from '../components/TimeSeriesPanel'
import { Toolbar } from '../components/Toolbar'
import { getCompany, getLatestValues, getSite } from '../services/domain'

export function DeviceGraphScreen({ role, filter, onFilterChange, device, onBack }) {
  const [period, setPeriod] = useState('24h')
  if (!device) {
    return (
      <div className="screen-stack">
        <Toolbar title="時系列グラフ" action="一覧へ戻る" detail="表示できるデバイスがありません。" onAction={onBack} />
      </div>
    )
  }

  const company = getCompany(device.companyId)
  const site = getSite(device.siteId)

  return (
    <div className="screen-stack">
      <div className="toolbar graph-toolbar">
        <div>
          <h2>{device.name}</h2>
          <p>{device.id} / {company?.name} / {site?.name}</p>
        </div>
        <div className="toolbar-actions">
          <button type="button" onClick={onBack}>一覧へ戻る</button>
          <button type="button">表示</button>
        </div>
      </div>

      <CommonFilter role={role} filter={filter} onChange={onFilterChange} />

      <FilterPanel>
        <SelectField label="表示期間" value={period} onChange={setPeriod}>
          <option value="1m">1分</option>
          <option value="10m">10分</option>
          <option value="1h">1時間</option>
          <option value="12h">12時間</option>
          <option value="24h">24時間</option>
          <option value="3d">3日</option>
          <option value="7d">7日</option>
          <option value="2w">2週間</option>
          <option value="1month">1ヶ月</option>
          <option value="3months">3ヶ月</option>
          <option value="6months">6ヶ月</option>
          <option value="1year">1年</option>
          <option value="custom">期間指定</option>
        </SelectField>
        {period === 'custom' && (
          <>
            <InputField label="開始日時" type="datetime-local" defaultValue="2026-05-28T00:00" />
            <InputField label="終了日時" type="datetime-local" defaultValue="2026-05-28T23:59" />
          </>
        )}
      </FilterPanel>

      <section className="graph-summary">
        <article className="metric-card compact">
          <span>通信状態</span>
          <strong><StatusBadge status={device.status} /></strong>
          <p>最終受信 {device.latestReceivedAt}</p>
        </article>
        <article className="metric-card compact">
          <span>最新値</span>
          <strong>{getLatestValues(device)}</strong>
          <p>GET /devices/{device.id}/graph</p>
        </article>
        <article className="metric-card compact">
          <span>閾値状態</span>
          <strong>{device.alert}</strong>
          <p>カラム別に閾値線と超過点を表示</p>
        </article>
      </section>

      <section className="graph-stack">
        {device.columns.map((column) => (
          <TimeSeriesPanel column={column} key={column.key} />
        ))}
      </section>
    </div>
  )
}
