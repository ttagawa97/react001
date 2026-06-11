import { roleLabels, roleProfiles } from '../data/constants'
import { companies, sites } from '../data/store'
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

  function changeCompany(companyId) {
    onChange({ companyId, siteId: 'all' })
  }

  function changeSite(siteId) {
    const selectedSite = sites.find((site) => site.id === siteId)
    onChange({
      ...filter,
      companyId: filter.companyId === 'all' && selectedSite ? selectedSite.companyId : filter.companyId,
      siteId,
    })
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
      <div className="filter-note">
        <span>適用権限</span>
        <strong>{roleLabels[role]}</strong>
      </div>
    </FilterPanel>
  )
}
