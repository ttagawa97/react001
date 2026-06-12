import { useEffect, useState } from 'react'
import { api } from '../api'
import { CommonFilter } from '../components/CommonFilter'
import { ApiErrorBanner, LoadingStrip } from '../components/Feedback'
import { StatusBadge } from '../components/Badges'
import { FilterPanel, InputField, SelectField } from '../components/FormFields'
import { TimeSeriesPanel } from '../components/TimeSeriesPanel'
import { Toolbar } from '../components/Toolbar'
import { applyGraphData, formatApiError, getCompany, getLatestValues, getSite } from '../services/domain'

const PERIOD_MILLISECONDS = {
  '1m': 60 * 1000,
  '10m': 10 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '12h': 12 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '3d': 3 * 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '2w': 14 * 24 * 60 * 60 * 1000,
  '1month': 30 * 24 * 60 * 60 * 1000,
  '3months': 90 * 24 * 60 * 60 * 1000,
  '6months': 180 * 24 * 60 * 60 * 1000,
  '1year': 365 * 24 * 60 * 60 * 1000,
}
const DEVICE_CLOCK_SKEW_MILLISECONDS = 15 * 60 * 1000

function getRangeParams(period, startDatetime, endDatetime) {
  if (period === 'custom') {
    return {
      from: startDatetime ? new Date(startDatetime).toISOString() : undefined,
      to: endDatetime ? new Date(endDatetime).toISOString() : undefined,
    }
  }

  const to = new Date()
  return {
    from: new Date(to.getTime() - PERIOD_MILLISECONDS[period]).toISOString(),
    to: new Date(to.getTime() + DEVICE_CLOCK_SKEW_MILLISECONDS).toISOString(),
  }
}

export function DeviceGraphScreen({ role, filter, onFilterChange, device, onBack }) {
  const [period, setPeriod] = useState('24h')
  const [startDatetime, setStartDatetime] = useState('')
  const [endDatetime, setEndDatetime] = useState('')
  const [graphColumns, setGraphColumns] = useState(device?.columns ?? [])
  const [isLoading, setIsLoading] = useState(Boolean(device))
  const [error, setError] = useState('')

  async function loadGraphData() {
    if (!device) return

    setIsLoading(true)
    setError('')
    try {
      const graphData = await api.getDeviceGraph(
        device.apiId ?? device.id,
        getRangeParams(period, startDatetime, endDatetime),
      )
      setGraphColumns(applyGraphData(device, graphData))
    } catch (loadError) {
      setGraphColumns(device.columns ?? [])
      setError(formatApiError(loadError))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!device) return undefined

    let isCurrent = true
    api.getDeviceGraph(
      device.apiId ?? device.id,
      getRangeParams('24h', '', ''),
    ).then((graphData) => {
      if (isCurrent) setGraphColumns(applyGraphData(device, graphData))
    }).catch((loadError) => {
      if (!isCurrent) return
      setGraphColumns(device.columns ?? [])
      setError(formatApiError(loadError))
    }).finally(() => {
      if (isCurrent) setIsLoading(false)
    })

    return () => {
      isCurrent = false
    }
  }, [device])

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
          <button type="button" disabled={isLoading} onClick={loadGraphData}>表示</button>
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
            <InputField label="開始日時" type="datetime-local" value={startDatetime} onChange={setStartDatetime} />
            <InputField label="終了日時" type="datetime-local" value={endDatetime} onChange={setEndDatetime} />
          </>
        )}
      </FilterPanel>

      {error && <ApiErrorBanner message={error} onClose={() => setError('')} />}
      {isLoading && <LoadingStrip>グラフデータを取得しています...</LoadingStrip>}

      <section className="graph-summary">
        <article className="metric-card compact">
          <span>通信状態</span>
          <strong><StatusBadge status={device.status} /></strong>
          <p>最終受信 {device.latestReceivedAt}</p>
        </article>
        <article className="metric-card compact">
          <span>最新値</span>
          <strong>{getLatestValues({ ...device, columns: graphColumns })}</strong>
          <p>GET /devices/{device.id}/graph</p>
        </article>
        <article className="metric-card compact">
          <span>閾値状態</span>
          <strong>{device.alert}</strong>
          <p>カラム別に閾値線と超過点を表示</p>
        </article>
      </section>

      <section className="graph-stack">
        {graphColumns.map((column) => (
          <TimeSeriesPanel column={column} key={column.key} />
        ))}
        {!isLoading && graphColumns.every((column) => column.values.length === 0) && (
          <article className="panel graph-panel empty-state">指定期間のデータはありません。</article>
        )}
      </section>
    </div>
  )
}
