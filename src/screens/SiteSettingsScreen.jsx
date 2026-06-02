import { useState } from 'react'
import { api } from '../api'
import { CommonFilter } from '../components/CommonFilter'
import { InputField, SelectField } from '../components/FormFields'
import { Table } from '../components/Table'
import { Toolbar } from '../components/Toolbar'
import { roleProfiles } from '../data/constants'
import { companies, sites } from '../data/store'
import { formatApiError, getCompany, loadInitialData } from '../services/domain'

export function SiteSettingsScreen({ role, filter, onFilterChange, onDataChanged, onError }) {
  const [isAddOpen, setIsAddOpen] = useState(false)
  const filteredSites = sites.filter((site) => (
    (filter.companyId === 'all' || site.companyId === filter.companyId) &&
    (filter.siteId === 'all' || site.id === filter.siteId)
  ))

  return (
    <div className="screen-stack">
      <Toolbar
        title="現場設定"
        action="現場を追加"
        detail="企業配下の現場マスタを権限範囲内で管理します。"
        onAction={() => setIsAddOpen(true)}
      />
      <CommonFilter role={role} filter={filter} onChange={onFilterChange} />
      <Table
        headers={['企業', '現場名', '住所', '状態']}
        rows={filteredSites.map((site) => [
          getCompany(site.companyId)?.name,
          site.name,
          site.address,
          site.status,
        ])}
      />
      {isAddOpen && (
        <SiteAddModal
          role={role}
          filter={filter}
          onDataChanged={onDataChanged}
          onError={onError}
          onClose={() => setIsAddOpen(false)}
        />
      )}
    </div>
  )
}

function SiteAddModal({ role, filter, onDataChanged, onError, onClose }) {
  const profile = roleProfiles[role]
  const fixedCompanyId = profile.companyId ?? (filter.companyId === 'all' ? companies[0].id : filter.companyId)
  const [companyId, setCompanyId] = useState(fixedCompanyId)
  const showCompanySelect = role === 'system_admin'

  async function submit(event) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    try {
      await api.createSite({
        company_id: companyId,
        site_name: formData.get('site_name'),
        address: formData.get('address'),
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
      <section className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="site-add-title">
        <div className="modal-header">
          <div>
            <h2 id="site-add-title">現場追加</h2>
            <p>POST /sites の入力項目モック</p>
          </div>
          <button className="ghost-button" type="button" onClick={onClose}>閉じる</button>
        </div>

        <form className="modal-form" onSubmit={submit}>
          {showCompanySelect ? (
            <SelectField label="企業" value={companyId} onChange={setCompanyId}>
              {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
            </SelectField>
          ) : (
            <div className="readonly-field">
              <span>企業</span>
              <strong>{getCompany(fixedCompanyId)?.name}</strong>
            </div>
          )}
          <InputField label="現場名" name="site_name" type="text" />
          <InputField label="住所" name="address" type="text" />
          <div className="modal-actions">
            <button className="ghost-button" type="button" onClick={onClose}>キャンセル</button>
            <button type="submit">保存</button>
          </div>
        </form>
      </section>
    </div>
  )
}
