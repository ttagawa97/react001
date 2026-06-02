import { roleLabels, roleProfiles } from '../data/constants'
import { companies, devices, sites } from '../data/store'
import { FilterPanel, SelectField } from './FormFields'

export function CommonFilter({ role, filter, onChange }) {
  const profile = roleProfiles[role]
  const companyDisabled = role !== 'system_admin'
  const siteDisabled = role === 'site_admin' || role === 'general_user'
  const companyOptions = role === 'system_admin'
    ? companies
    : companies.filter((company) => company.id === profile.companyId)
  const siteOptions = sites.filter((site) => (
    (profile.companyId ? site.companyId === profile.companyId : filter.companyId === 'all' || site.companyId === filter.companyId) &&
    (!profile.siteId || site.id === profile.siteId)
  ))
  const deviceOptions = devices.filter((device) => (
    (filter.companyId === 'all' || device.companyId === filter.companyId) &&
    (filter.siteId === 'all' || device.siteId === filter.siteId)
  ))

  function changeCompany(companyId) {
    onChange({ companyId, siteId: 'all', deviceId: 'all' })
  }

  function changeSite(siteId) {
    onChange({ ...filter, siteId, deviceId: 'all' })
  }

  function changeDevice(deviceId) {
    onChange({ ...filter, deviceId })
  }

  return (
    <FilterPanel>
      <SelectField label="企業" value={filter.companyId} onChange={changeCompany} disabled={companyDisabled}>
        {role === 'system_admin' && <option value="all">全企業</option>}
        {companyOptions.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
      </SelectField>
      <SelectField label="現場" value={filter.siteId} onChange={changeSite} disabled={siteDisabled}>
        {!profile.siteId && <option value="all">全現場</option>}
        {siteOptions.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}
      </SelectField>
      <SelectField label="デバイス" value={filter.deviceId} onChange={changeDevice}>
        <option value="all">全デバイス</option>
        {deviceOptions.map((device) => <option key={device.id} value={device.id}>{device.name}</option>)}
      </SelectField>
      <div className="filter-note">
        <span>適用権限</span>
        <strong>{roleLabels[role]}</strong>
      </div>
    </FilterPanel>
  )
}
