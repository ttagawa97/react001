import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../api'
import { ApiErrorBanner, LoadingStrip } from '../components/Feedback'
import { StatusBadge } from '../components/Badges'
import { FilterPanel, InputField, SelectField } from '../components/FormFields'
import { TimeSeriesDataTable } from '../components/TimeSeriesDataTable'
import { TimeSeriesPanel } from '../components/TimeSeriesPanel'
import { Toolbar } from '../components/Toolbar'
import {
  applyGraphData,
  applyThresholdData,
  formatApiError,
  getCompany,
  getLatestValues,
  getSite,
  getThresholdStatus,
} from '../services/domain'

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
function getTodayDate() {
  const now = new Date()
  const offsetDate = new Date(now.getTime() - now.getTimezoneOffset() * 60 * 1000)
  return offsetDate.toISOString().slice(0, 10)
}

function getDateRangeParams(startDate, endDate) {
  const from = new Date(`${startDate}T00:00:00`)
  const to = new Date(`${endDate}T23:59:59.999`)
  return {
    from: from.toISOString(),
    to: to.toISOString(),
  }
}

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
    to: to.toISOString(),
  }
}

function getDownloadFileName(contentDisposition, deviceId, startDate, endDate) {
  const encodedName = contentDisposition?.match(/filename\*=UTF-8''([^;]+)/i)?.[1]
  if (encodedName) {
    try {
      return decodeURIComponent(encodedName)
    } catch {
      // Fall through to the plain filename or generated default.
    }
  }

  const plainName = contentDisposition?.match(/filename="?([^";]+)"?/i)?.[1]
  return plainName || `${deviceId}_${startDate}_${endDate}.csv`
}

function saveBlob(blob, fileName) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

async function selectCsvSaveFile(fileName) {
  if (!window.showSaveFilePicker) return null

  return window.showSaveFilePicker({
    suggestedName: fileName,
    types: [
      {
        description: 'CSVファイル',
        accept: { 'text/csv': ['.csv'] },
      },
    ],
    excludeAcceptAllOption: true,
  })
}

async function writeBlobToFile(fileHandle, blob) {
  const writable = await fileHandle.createWritable()
  await writable.write(blob)
  await writable.close()
}

export function DeviceGraphScreen({ device, onBack }) {
  const today = getTodayDate()
  const [activeTab, setActiveTab] = useState('graph')
  const [period, setPeriod] = useState('24h')
  const [startDatetime, setStartDatetime] = useState('')
  const [endDatetime, setEndDatetime] = useState('')
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(today)
  const [graphColumns, setGraphColumns] = useState(device?.columns ?? [])
  const [timeSeriesColumns, setTimeSeriesColumns] = useState(device?.columns ?? [])
  const [hasLoadedTimeSeries, setHasLoadedTimeSeries] = useState(false)
  const [isLoading, setIsLoading] = useState(Boolean(device))
  const [isDownloadingCsv, setIsDownloadingCsv] = useState(false)
  const [error, setError] = useState('')
  const graphRequestIdRef = useRef(0)

  const fetchGraphColumns = useCallback(async (rangeParams) => {
    const [graphData, thresholdData] = await Promise.all([
      api.getDeviceGraph(device.id, rangeParams),
      api.listThresholds({
        company_id: device.companyId,
        site_id: device.siteId,
      }).catch(() => []),
    ])
    const deviceWithThresholds = applyThresholdData(device, thresholdData)
    return applyGraphData(deviceWithThresholds, graphData)
  }, [device])

  async function loadGraphData(
    selectedPeriod = period,
    selectedStartDatetime = startDatetime,
    selectedEndDatetime = endDatetime,
  ) {
    if (!device) return

    const requestId = ++graphRequestIdRef.current
    setIsLoading(true)
    setError('')
    try {
      const columns = await fetchGraphColumns(
        getRangeParams(selectedPeriod, selectedStartDatetime, selectedEndDatetime),
      )
      if (requestId === graphRequestIdRef.current) {
        setGraphColumns(columns)
      }
    } catch (loadError) {
      if (requestId === graphRequestIdRef.current) {
        setGraphColumns(device.columns ?? [])
        setError(formatApiError(loadError))
      }
    } finally {
      if (requestId === graphRequestIdRef.current) setIsLoading(false)
    }
  }

  function changeGraphPeriod(selectedPeriod) {
    setPeriod(selectedPeriod)
    if (selectedPeriod !== 'custom') loadGraphData(selectedPeriod, '', '')
  }

  async function loadTimeSeriesData() {
    if (!device) return
    const rangeParams = validateTimeSeriesRange()
    if (!rangeParams) return

    setIsLoading(true)
    setError('')
    try {
      const graphData = await api.getDeviceGraph(
        device.id,
        rangeParams,
      )
      setTimeSeriesColumns(applyGraphData(device, graphData))
      setHasLoadedTimeSeries(true)
    } catch (loadError) {
      setTimeSeriesColumns(device.columns ?? [])
      setError(formatApiError(loadError))
    } finally {
      setIsLoading(false)
    }
  }

  function validateTimeSeriesRange() {
    if (!startDate || !endDate) {
      setError('開始日と終了日を指定してください。')
      return null
    }
    if (startDate > endDate) {
      setError('開始日は終了日以前の日付を指定してください。')
      return null
    }
    return getDateRangeParams(startDate, endDate)
  }

  async function downloadTimeSeriesCsv() {
    if (!device) return
    const rangeParams = validateTimeSeriesRange()
    if (!rangeParams) return

    const defaultFileName = `${device.id}_${startDate}_${endDate}.csv`
    let fileHandle
    try {
      fileHandle = await selectCsvSaveFile(defaultFileName)
    } catch (pickerError) {
      if (pickerError?.name === 'AbortError') return
      setError('保存先の選択画面を開けませんでした。')
      return
    }

    setIsDownloadingCsv(true)
    setError('')
    try {
      const { blob, contentDisposition } = await api.downloadDeviceGraphCsv(device.id, rangeParams)
      if (fileHandle) {
        await writeBlobToFile(fileHandle, blob)
      } else {
        saveBlob(blob, getDownloadFileName(contentDisposition, device.id, startDate, endDate))
      }
    } catch (downloadError) {
      setError(formatApiError(downloadError))
    } finally {
      setIsDownloadingCsv(false)
    }
  }

  function showTimeSeriesTab() {
    setActiveTab('time-series')
    if (!hasLoadedTimeSeries) loadTimeSeriesData()
  }

  useEffect(() => {
    if (!device) return undefined

    let isCurrent = true
    const requestId = ++graphRequestIdRef.current
    fetchGraphColumns(
      getRangeParams('24h', '', ''),
    ).then((columns) => {
      if (isCurrent && requestId === graphRequestIdRef.current) {
        setGraphColumns(columns)
      }
    }).catch((loadError) => {
      if (!isCurrent || requestId !== graphRequestIdRef.current) return
      setGraphColumns(device.columns ?? [])
      setError(formatApiError(loadError))
    }).finally(() => {
      if (isCurrent && requestId === graphRequestIdRef.current) setIsLoading(false)
    })

    return () => {
      isCurrent = false
    }
  }, [device, fetchGraphColumns])

  if (!device) {
    return (
      <div className="screen-stack">
        <Toolbar title="時系列グラフ" action="一覧へ戻る" detail="表示できるデバイスがありません。" onAction={onBack} />
      </div>
    )
  }

  const company = getCompany(device.companyId)
  const site = getSite(device.siteId)
  const thresholdStatus = getThresholdStatus(graphColumns, device.latestValues)

  return (
    <div className="screen-stack">
      <div className="toolbar graph-toolbar">
        <div>
          <h2>{device.name}</h2>
          <p>{device.id} / {company?.name} / {site?.name}</p>
        </div>
        <div className="toolbar-actions">
          <button type="button" onClick={onBack}>一覧へ戻る</button>
          {activeTab === 'graph' && (
            <button type="button" disabled={isLoading} onClick={() => loadGraphData()}>
              表示
            </button>
          )}
        </div>
      </div>

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
          <strong>{thresholdStatus}</strong>
          <p>カラム別に閾値線と超過点を表示</p>
        </article>
      </section>

      <div className="view-tabs" role="tablist" aria-label="データ表示形式">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'graph'}
          className={activeTab === 'graph' ? 'active' : ''}
          onClick={() => setActiveTab('graph')}
        >
          グラフ表示
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'time-series'}
          className={activeTab === 'time-series' ? 'active' : ''}
          onClick={showTimeSeriesTab}
        >
          時系列表示
        </button>
      </div>

      {activeTab === 'graph' ? (
        <FilterPanel>
          <SelectField
            label="表示期間"
            value={period}
            onChange={changeGraphPeriod}
            formControlProps={{ flex: '0 0 180px', minW: '180px', maxW: '180px' }}
          >
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
      ) : (
        <FilterPanel>
          <InputField
            label="開始日"
            type="date"
            value={startDate}
            onChange={setStartDate}
            formControlProps={{ flex: '0 0 190px', minW: '190px', maxW: '190px' }}
          />
          <InputField
            label="終了日"
            type="date"
            value={endDate}
            onChange={setEndDate}
            formControlProps={{ flex: '0 0 190px', minW: '190px', maxW: '190px' }}
          />
          <button
            className="filter-submit-button"
            type="button"
            disabled={isLoading || isDownloadingCsv}
            onClick={loadTimeSeriesData}
          >
            表示
          </button>
          <button
            className="filter-submit-button csv-download-button"
            type="button"
            disabled={isLoading || isDownloadingCsv}
            onClick={downloadTimeSeriesCsv}
          >
            {isDownloadingCsv ? 'CSV作成中...' : 'CSVダウンロード'}
          </button>
        </FilterPanel>
      )}

      {error && <ApiErrorBanner message={error} onClose={() => setError('')} />}
      {isLoading && <LoadingStrip>データを取得しています...</LoadingStrip>}

      {activeTab === 'graph' ? (
        <section className="graph-stack" role="tabpanel">
          {graphColumns.map((column) => (
            <TimeSeriesPanel column={column} key={column.key} />
          ))}
          {!isLoading && graphColumns.every((column) => column.values.length === 0) && (
            <article className="panel graph-panel empty-state">指定期間のデータはありません。</article>
          )}
        </section>
      ) : (
        <div role="tabpanel">
          <TimeSeriesDataTable columns={timeSeriesColumns} />
        </div>
      )}
    </div>
  )
}
