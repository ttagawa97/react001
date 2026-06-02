import { useState } from 'react'
import { api } from '../api'
import { StatusPill } from '../components/Badges'
import { InputField, SelectField } from '../components/FormFields'
import { Table } from '../components/Table'
import { Toolbar } from '../components/Toolbar'
import { companies, sites } from '../data/store'
import { formatApiError, loadInitialData } from '../services/domain'

export function CompanySettingsScreen({ onDataChanged, onError }) {
  const [companyFormState, setCompanyFormState] = useState(null)
  const activeCompanies = companies.filter((company) => company.status === 'active').length
  const inactiveCompanies = companies.length - activeCompanies

  return (
    <div className="screen-stack">
      <Toolbar
        title="企業マスタ管理"
        action="企業追加"
        detail="システム管理者のみが企業の追加・変更・無効化を操作できます。"
        onAction={() => setCompanyFormState({ mode: 'create', company: null })}
      />

      <section className="metric-grid company-metrics">
        <article className="metric-card">
          <span>企業数</span>
          <strong>{companies.length}</strong>
          <p>GET /companies の一覧件数</p>
        </article>
        <article className="metric-card">
          <span>有効企業</span>
          <strong>{activeCompanies}</strong>
          <p>ログイン・現場作成の対象</p>
        </article>
        <article className="metric-card">
          <span>無効企業</span>
          <strong>{inactiveCompanies}</strong>
          <p>参照のみ。新規紐付け不可</p>
        </article>
      </section>

      <Table
        headers={['企業ID', '企業名', '状態', '現場数', '作成日時', '更新日時']}
        rows={companies.map((company) => ({
          id: company.id,
          onDoubleClick: () => setCompanyFormState({ mode: 'update', company }),
          cells: [
            company.id,
            company.name,
            <StatusPill key={company.id} tone={company.status === 'active' ? 'active' : 'inactive'}>
              {company.status === 'active' ? '有効' : '無効'}
            </StatusPill>,
            sites.filter((site) => site.companyId === company.id).length,
            company.createdAt,
            company.updatedAt,
          ],
        }))}
      />

      {companyFormState && (
        <CompanyFormModal
          mode={companyFormState.mode}
          company={companyFormState.company}
          onDataChanged={onDataChanged}
          onError={onError}
          onClose={() => setCompanyFormState(null)}
        />
      )}
    </div>
  )
}

function CompanyFormModal({ mode, company, onDataChanged, onError, onClose }) {
  const isUpdate = mode === 'update'
  const [status, setStatus] = useState(company?.status ?? 'active')
  const [disableMessage, setDisableMessage] = useState('')
  const modalTitle = isUpdate ? '企業変更' : '企業追加'
  const apiLabel = isUpdate ? 'PUT /companies/{company_id}' : 'POST /companies'

  async function disableCompany() {
    try {
      await api.disableCompany(company.id)
      await loadInitialData()
      setStatus('inactive')
      setDisableMessage('企業無効化リクエストを受け付けました')
      onDataChanged()
    } catch (error) {
      onError(formatApiError(error))
    }
  }

  async function submit(event) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const body = {
      name: formData.get('company_name'),
      status,
    }

    try {
      if (isUpdate) {
        await api.updateCompany(company.id, body)
      } else {
        await api.createCompany(body)
      }
      await loadInitialData()
      onDataChanged()
      onClose()
    } catch (error) {
      onError(formatApiError(error))
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="company-form-title">
        <div className="modal-header">
          <div>
            <h2 id="company-form-title">{modalTitle}</h2>
            <p>{apiLabel} の入力項目モック</p>
          </div>
          <button className="ghost-button" type="button" onClick={onClose}>閉じる</button>
        </div>

        <form className="modal-form" onSubmit={submit}>
          {isUpdate && (
            <div className="readonly-field">
              <span>企業ID</span>
              <strong>{company.id}</strong>
            </div>
          )}
          <InputField label="企業名" name="company_name" type="text" defaultValue={company?.name ?? ''} />
          <SelectField label="ステータス" value={status} onChange={setStatus}>
            <option value="active">有効</option>
            <option value="inactive">無効</option>
          </SelectField>
          {isUpdate && (
            <div className="reset-area danger-area">
              <button className="ghost-button" type="button" onClick={disableCompany}>企業を無効化</button>
              {disableMessage && <span>{disableMessage}</span>}
            </div>
          )}
          <div className="modal-actions">
            <button className="ghost-button" type="button" onClick={onClose}>キャンセル</button>
            <button type="submit">保存</button>
          </div>
        </form>
      </section>
    </div>
  )
}
