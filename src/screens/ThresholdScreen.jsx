import { useState } from 'react'
import { api } from '../api'
import { CommonFilter } from '../components/CommonFilter'
import { FilterPanel, InputField, SelectField, TextareaField } from '../components/FormFields'
import { Table } from '../components/Table'
import { Toolbar } from '../components/Toolbar'
import { roleProfiles } from '../data/constants'
import { companies, devices, sites } from '../data/store'
import { formatApiError, getDevice, getSite, getCompany, getThresholdRows, loadInitialData, matchesFilter } from '../services/domain'

export function ThresholdScreen({ role, filter, onFilterChange, onDataChanged, onError }) {
  const scopedDevices = devices.filter((device) => matchesFilter(device, filter))
  const selectedDevice = filter.deviceId !== 'all' ? getDevice(filter.deviceId) : scopedDevices[0]
  const [columnKey, setColumnKey] = useState(selectedDevice?.columns[0]?.key ?? '')
  const [isThresholdFormOpen, setIsThresholdFormOpen] = useState(false)
  const availableColumns = selectedDevice?.columns ?? []
  const safeColumnKey = availableColumns.some((column) => column.key === columnKey)
    ? columnKey
    : availableColumns[0]?.key ?? ''
  const rows = getThresholdRows(scopedDevices).filter((row) => (
    !safeColumnKey || row.columnKey === safeColumnKey
  ))

  return (
    <div className="screen-stack">
      <Toolbar
        title="閾値設定"
        action="閾値を追加"
        detail="共通絞り込みにカラム選択を追加し、データ項目単位で閾値を管理します。"
        onAction={() => setIsThresholdFormOpen(true)}
      />
      <CommonFilter role={role} filter={filter} onChange={onFilterChange} />
      <FilterPanel>
        <SelectField label="カラム" value={safeColumnKey} onChange={setColumnKey}>
          {availableColumns.map((column) => <option key={column.key} value={column.key}>{column.label}</option>)}
        </SelectField>
      </FilterPanel>
      <Table
        headers={['企業', '現場', 'デバイス', 'カラム', '閾値名', '下限', '上限', '通知先', '抑止時間']}
        rows={rows}
      />
      {isThresholdFormOpen && (
        <ThresholdFormModal
          role={role}
          filter={filter}
          selectedColumnKey={safeColumnKey}
          onDataChanged={onDataChanged}
          onError={onError}
          onClose={() => setIsThresholdFormOpen(false)}
        />
      )}
    </div>
  )
}

function ThresholdFormModal({ role, filter, selectedColumnKey, onDataChanged, onError, onClose }) {
  const profile = roleProfiles[role]
  const initialCompanyId = profile.companyId ?? (filter.companyId === 'all' ? companies[0].id : filter.companyId)
  const initialSiteId = profile.siteId ?? (filter.siteId === 'all'
    ? sites.find((site) => site.companyId === initialCompanyId)?.id ?? ''
    : filter.siteId)
  const initialDeviceId = filter.deviceId === 'all'
    ? devices.find((device) => device.companyId === initialCompanyId && device.siteId === initialSiteId)?.id ?? ''
    : filter.deviceId
  const initialColumnKey = selectedColumnKey || getDevice(initialDeviceId)?.columns[0]?.key || ''
  const [companyId, setCompanyId] = useState(initialCompanyId)
  const [siteId, setSiteId] = useState(initialSiteId)
  const [deviceId, setDeviceId] = useState(initialDeviceId)
  const [columnKey, setColumnKey] = useState(initialColumnKey)
  const companyEditable = role === 'system_admin' && filter.companyId === 'all'
  const siteEditable = !profile.siteId && filter.siteId === 'all'
  const deviceEditable = filter.deviceId === 'all'
  const availableSites = sites.filter((site) => site.companyId === companyId)
  const availableDevices = devices.filter((device) => device.companyId === companyId && device.siteId === siteId)
  const selectedDevice = getDevice(deviceId)
  const availableColumns = selectedDevice?.columns ?? []
  const safeColumnKey = availableColumns.some((column) => column.key === columnKey)
    ? columnKey
    : availableColumns[0]?.key ?? ''

  function changeCompany(nextCompanyId) {
    const nextSite = sites.find((site) => site.companyId === nextCompanyId)
    const nextDevice = devices.find((device) => device.companyId === nextCompanyId && device.siteId === nextSite?.id)
    setCompanyId(nextCompanyId)
    setSiteId(nextSite?.id ?? '')
    setDeviceId(nextDevice?.id ?? '')
    setColumnKey(nextDevice?.columns[0]?.key ?? '')
  }

  function changeSite(nextSiteId) {
    const nextDevice = devices.find((device) => device.companyId === companyId && device.siteId === nextSiteId)
    setSiteId(nextSiteId)
    setDeviceId(nextDevice?.id ?? '')
    setColumnKey(nextDevice?.columns[0]?.key ?? '')
  }

  function changeDevice(nextDeviceId) {
    const nextDevice = getDevice(nextDeviceId)
    setDeviceId(nextDeviceId)
    setColumnKey(nextDevice?.columns[0]?.key ?? '')
  }

  async function submit(event) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const thresholdDevice = getDevice(deviceId)
    try {
      await api.createThreshold({
        company: companyId,
        site: siteId,
        device: thresholdDevice?.apiId ?? deviceId,
        column_name: safeColumnKey,
        threshold_name: formData.get('threshold_name'),
        lower_limit: formData.get('lower_limit') || null,
        upper_limit: formData.get('upper_limit') || null,
        notification_emails: formData.get('notification_emails'),
        suppress_minutes: formData.get('suppress_minutes'),
      })
      await loadInitialData()
      onDataChanged()
      onClose()
    } catch (error) {
      onError(formatApiError(error))
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="threshold-form-title">
        <div className="modal-header">
          <div>
            <h2 id="threshold-form-title">閾値追加</h2>
            <p>POST /thresholds の入力項目モック</p>
          </div>
          <button className="ghost-button" type="button" onClick={onClose}>閉じる</button>
        </div>

        <form className="modal-form" onSubmit={submit}>
          {companyEditable ? (
            <SelectField label="企業" value={companyId} onChange={changeCompany}>
              {companies.filter((company) => company.status === 'active').map((company) => (
                <option key={company.id} value={company.id}>{company.name}</option>
              ))}
            </SelectField>
          ) : (
            <div className="readonly-field">
              <span>企業</span>
              <strong>{getCompany(companyId)?.name}</strong>
            </div>
          )}

          {siteEditable ? (
            <SelectField label="現場" value={siteId} onChange={changeSite}>
              {availableSites.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}
            </SelectField>
          ) : (
            <div className="readonly-field">
              <span>現場</span>
              <strong>{getSite(siteId)?.name}</strong>
            </div>
          )}

          {deviceEditable ? (
            <SelectField label="デバイス" value={deviceId} onChange={changeDevice}>
              {availableDevices.map((device) => <option key={device.id} value={device.id}>{device.name}</option>)}
            </SelectField>
          ) : (
            <div className="readonly-field">
              <span>デバイス</span>
              <strong>{selectedDevice?.name}</strong>
            </div>
          )}

          <SelectField label="カラム" value={safeColumnKey} onChange={setColumnKey}>
            {availableColumns.map((column) => <option key={column.key} value={column.key}>{column.label}</option>)}
          </SelectField>
          <InputField label="閾値名" name="threshold_name" type="text" defaultValue="" />
          <div className="form-grid-2">
            <InputField label="下限値" name="lower_limit" type="number" defaultValue="" />
            <InputField label="上限値" name="upper_limit" type="number" defaultValue="" />
          </div>
          <TextareaField label="通知先メールアドレス" name="notification_emails" defaultValue="ops@example.com, admin@example.com" />
          <InputField label="再通知抑止時間（分）" name="suppress_minutes" type="number" defaultValue="30" />
          <div className="modal-actions">
            <button className="ghost-button" type="button" onClick={onClose}>キャンセル</button>
            <button type="submit">保存</button>
          </div>
        </form>
      </section>
    </div>
  )
}
