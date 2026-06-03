import { useState } from 'react'
import { api } from '../api'
import { StatusBadge } from '../components/Badges'
import { CommonFilter } from '../components/CommonFilter'
import { InputField, SelectField } from '../components/FormFields'
import { Table } from '../components/Table'
import { PanelHeader, Toolbar } from '../components/Toolbar'
import { roleProfiles } from '../data/constants'
import { companies, devices, sites } from '../data/store'
import { formatApiError, getCompany, getSite, loadInitialData, matchesFilter } from '../services/domain'

export function DeviceSettingsScreen({ role, filter, onFilterChange, onDataChanged, onError }) {
  const [deviceFormState, setDeviceFormState] = useState(null)
  const filteredDevices = devices.filter((device) => matchesFilter(device, filter))

  return (
    <div className="screen-stack">
      <Toolbar
        title="デバイス設定"
        action="デバイスを追加"
        detail="現場配下にデバイスと入力カラム定義を登録します。"
        onAction={() => setDeviceFormState({ mode: 'create', device: null })}
      />
      <CommonFilter role={role} filter={filter} onChange={onFilterChange} />
      <Table
        headers={['企業', '現場', 'デバイス名', 'デバイスID', '入力タイプ', '受信データ数', '状態']}
        rows={filteredDevices.map((device) => ({
          id: device.id,
          onDoubleClick: () => setDeviceFormState({ mode: 'update', device }),
          cells: [
            getCompany(device.companyId)?.name,
            getSite(device.siteId)?.name,
            device.name,
            device.id,
            device.inputType === 'csv' ? `${device.inputType} / ${device.csvHeaderMode}` : device.inputType,
            device.columns.length,
            <StatusBadge key={device.id} status={device.status} />,
          ],
        }))}
      />
      <section className="settings-grid">
        {filteredDevices.slice(0, 3).map((device) => (
          <article className="panel" key={device.id}>
            <PanelHeader title={device.name} detail={`${getSite(device.siteId)?.name} / ${device.id}`} />
            <Table
              compact
              headers={['カラム名', '表示名', '型', '単位', '重み', '順']}
              rows={device.columns.map((column) => [
                column.key,
                column.label,
                column.type,
                column.unit || '-',
                column.weight ?? 1,
                column.order,
              ])}
            />
          </article>
        ))}
      </section>
      {deviceFormState && (
        <DeviceFormModal
          role={role}
          mode={deviceFormState.mode}
          device={deviceFormState.device}
          onDataChanged={onDataChanged}
          onError={onError}
          onClose={() => setDeviceFormState(null)}
        />
      )}
    </div>
  )
}

function DeviceFormModal({ role, mode, device, onDataChanged, onError, onClose }) {
  const isUpdate = mode === 'update'
  const profile = roleProfiles[role]
  const initialCompanyId = device?.companyId ?? profile.companyId ?? companies[0].id
  const initialSiteId = device?.siteId ?? profile.siteId ?? sites.find((site) => site.companyId === initialCompanyId)?.id ?? ''
  const [companyId, setCompanyId] = useState(initialCompanyId)
  const [siteId, setSiteId] = useState(initialSiteId)
  const [inputType, setInputType] = useState(device?.inputType ?? 'json')
  const [csvHeaderMode, setCsvHeaderMode] = useState(device?.csvHeaderMode === '-' ? 'header_exists' : device?.csvHeaderMode ?? 'header_exists')
  const [columns, setColumns] = useState(device?.columns ?? [
    { key: 'value', label: '値', type: 'number', unit: '', weight: 1, order: 1 },
  ])
  const companyEditable = role === 'system_admin'
  const siteEditable = role === 'system_admin' || role === 'company_admin'
  const availableSites = sites.filter((site) => site.companyId === companyId)
  const modalTitle = isUpdate ? 'デバイス変更' : 'デバイス追加'
  const apiLabel = isUpdate ? 'PUT /devices/{device_id}' : 'POST /devices'

  function changeCompany(nextCompanyId) {
    const firstSite = sites.find((site) => site.companyId === nextCompanyId)
    setCompanyId(nextCompanyId)
    setSiteId(firstSite?.id ?? '')
  }

  function addColumn() {
    if (columns.length >= 256) return
    setColumns([
      ...columns,
      { key: `column_${columns.length + 1}`, label: `カラム${columns.length + 1}`, type: 'number', unit: '', weight: 1, order: columns.length + 1 },
    ])
  }

  function removeColumn(index) {
    if (columns.length <= 1) return
    setColumns(columns.filter((_, columnIndex) => columnIndex !== index))
  }

  async function submit(event) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const body = {
      company: companyId,
      site: siteId,
      device_name: formData.get('device_name'),
      device_id: formData.get('device_id'),
      auth_id: formData.get('auth_id'),
      auth_password: formData.get('auth_password') || undefined,
      input_type: inputType,
      csv_header_mode: inputType === 'csv' ? csvHeaderMode : 'header_exists',
      columns: columns.map((column, index) => ({
        column_name: formData.get(`column_name_${index}`) || column.key,
        display_name: formData.get(`display_name_${index}`) || column.label,
        data_type: formData.get(`data_type_${index}`) || column.type,
        unit: formData.get(`unit_${index}`) ?? column.unit,
        weight: formData.get(`weight_${index}`) || column.weight || 1,
        display_order: index + 1,
      })),
    }

    try {
      if (isUpdate) {
        await api.updateDevice(device.id, body)
      } else {
        await api.createDevice(body)
      }
      await loadInitialData(role)
      onDataChanged()
      onClose()
    } catch (error) {
      onError(formatApiError(error))
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal-panel wide-modal" role="dialog" aria-modal="true" aria-labelledby="device-form-title">
        <div className="modal-header">
          <div>
            <h2 id="device-form-title">{modalTitle}</h2>
            <p>{apiLabel} の入力項目モック</p>
          </div>
          <button className="ghost-button" type="button" onClick={onClose}>閉じる</button>
        </div>

        <form className="modal-form" onSubmit={submit}>
          <div className="form-grid-2">
            {companyEditable ? (
              <SelectField label="企業" value={companyId} onChange={changeCompany}>
                {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
              </SelectField>
            ) : (
              <div className="readonly-field">
                <span>企業</span>
                <strong>{getCompany(companyId)?.name}</strong>
              </div>
            )}

            {siteEditable ? (
              <SelectField label="現場" value={siteId} onChange={setSiteId}>
                {availableSites.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}
              </SelectField>
            ) : (
              <div className="readonly-field">
                <span>現場</span>
                <strong>{getSite(siteId)?.name}</strong>
              </div>
            )}

            <InputField label="デバイス名" name="device_name" type="text" defaultValue={device?.name ?? ''} />
            <InputField label="デバイスID" name="device_id" type="text" defaultValue={device?.id ?? ''} disabled={isUpdate} />
            <InputField label="認証ID" name="auth_id" type="text" defaultValue={device?.authId ?? ''} />
            <InputField label={isUpdate ? '認証パスワード（入力時のみ上書き）' : '認証パスワード'} name="auth_password" type="password" />
            <SelectField label="データ入力タイプ" value={inputType} onChange={setInputType}>
              <option value="json">json</option>
              <option value="csv">csv</option>
            </SelectField>
            {inputType === 'csv' && (
              <SelectField label="CSVヘッダ" value={csvHeaderMode} onChange={setCsvHeaderMode}>
                <option value="header_exists">header_exists</option>
                <option value="no_header">no_header</option>
              </SelectField>
            )}
          </div>

          <section className="editable-table-block">
            <div className="subsection-header">
              <div>
                <h3>カラム設定</h3>
                <p>1個以上256個以下。表示値とグラフ値は 受信値 × 重み設定 です。</p>
              </div>
              <button className="ghost-button" type="button" onClick={addColumn}>カラム追加</button>
            </div>
            <div className="editable-table">
              <div className="editable-row header-row">
                <span>カラム名</span>
                <span>表示名</span>
                <span>型</span>
                <span>単位</span>
                <span>重み</span>
                <span></span>
              </div>
              {columns.map((column, index) => (
                <div className="editable-row" key={`${column.key}-${index}`}>
                  <input name={`column_name_${index}`} defaultValue={column.key} />
                  <input name={`display_name_${index}`} defaultValue={column.label} />
                  <select name={`data_type_${index}`} defaultValue={column.type}>
                    <option value="number">number</option>
                    <option value="string">string</option>
                    <option value="boolean">boolean</option>
                  </select>
                  <input name={`unit_${index}`} defaultValue={column.unit} />
                  <input name={`weight_${index}`} defaultValue={column.weight ?? 1} type="number" step="0.001" />
                  <button className="ghost-button" type="button" onClick={() => removeColumn(index)}>削除</button>
                </div>
              ))}
            </div>
          </section>

          <div className="modal-actions">
            <button className="ghost-button" type="button" onClick={onClose}>キャンセル</button>
            <button type="submit">保存</button>
          </div>
        </form>
      </section>
    </div>
  )
}
