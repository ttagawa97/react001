import { useState } from 'react'
import { api } from '../api'
import { CommonFilter } from '../components/CommonFilter'
import { InputField, SelectField } from '../components/FormFields'
import { Table } from '../components/Table'
import { Toolbar } from '../components/Toolbar'
import { roleLabels, roleProfiles } from '../data/constants'
import { companies, sites, users } from '../data/store'
import { formatApiError, getCompany, getSite, loadInitialData } from '../services/domain'
import { getUserAddRoleOptions } from '../services/users'

export function UsersScreen({ role, filter, onFilterChange, onDataChanged, onError }) {
  const [userFormState, setUserFormState] = useState(null)
  const filteredUsers = users.filter((user) => {
    const companyMatch = filter.companyId === 'all' || !user.companyId || user.companyId === filter.companyId
    const siteMatch = filter.siteId === 'all' || !user.siteId || user.siteId === filter.siteId
    return companyMatch && siteMatch
  })

  return (
    <div className="screen-stack">
      <Toolbar
        title="ロール別ユーザー"
        action="ユーザー追加"
        detail="一般ユーザーは所属現場参照型として表示します。"
        onAction={() => setUserFormState({ mode: 'create', user: null })}
      />
      <CommonFilter role={role} filter={filter} onChange={onFilterChange} />
      <Table
        headers={['ログインID', 'ユーザー名', 'ロール', '企業', '現場', '状態']}
        rows={filteredUsers.map((user) => ({
          id: user.id,
          onDoubleClick: () => setUserFormState({ mode: 'update', user }),
          cells: [
            user.loginId,
            user.userName,
            roleLabels[user.roleId],
            getCompany(user.companyId)?.name ?? '-',
            getSite(user.siteId)?.name ?? '-',
            user.status,
          ],
        }))}
      />
      {userFormState && (
        <UserFormModal
          role={role}
          mode={userFormState.mode}
          user={userFormState.user}
          onDataChanged={onDataChanged}
          onError={onError}
          onClose={() => setUserFormState(null)}
        />
      )}
    </div>
  )
}

function UserFormModal({ role, mode, user, onDataChanged, onError, onClose }) {
  const profile = roleProfiles[role]
  const isUpdate = mode === 'update'
  const initialCompanyId = user?.companyId ?? profile.companyId ?? ''
  const initialSiteId = user?.siteId ?? profile.siteId ?? ''
  const [companyId, setCompanyId] = useState(initialCompanyId)
  const [siteId, setSiteId] = useState(initialSiteId)
  const [status, setStatus] = useState(user?.status === '一時停止' ? 'inactive' : 'active')
  const [resetMessage, setResetMessage] = useState('')
  const companyEditable = role === 'system_admin'
  const siteEditable = role === 'system_admin' || role === 'company_admin'
  const availableSites = sites.filter((site) => site.companyId === companyId)
  const roleOptions = getUserAddRoleOptions(role, companyId, siteId)
  const [newRole, setNewRole] = useState(user?.roleId ?? roleOptions[0] ?? 'general_user')
  const selectedRole = roleOptions.includes(newRole) ? newRole : roleOptions[0] ?? ''
  const modalTitle = isUpdate ? 'ユーザー変更' : 'ユーザー追加'
  const apiLabel = isUpdate ? 'PUT /users/{user_id}' : 'POST /users'

  function changeCompany(nextCompanyId) {
    setCompanyId(nextCompanyId)
    setSiteId('')
    setNewRole(getUserAddRoleOptions(role, nextCompanyId, '')[0] ?? '')
  }

  function changeSite(nextSiteId) {
    setSiteId(nextSiteId)
    setNewRole(getUserAddRoleOptions(role, companyId, nextSiteId)[0] ?? '')
  }

  async function resetPassword() {
    try {
      await api.resetUserPassword(user.id)
      setResetMessage('パスワードリセット要求を受け付けました')
    } catch (error) {
      onError(formatApiError(error))
    }
  }

  async function submit(event) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const body = {
      company_id: companyId || null,
      site_id: siteId || null,
      role: selectedRole,
      login_id: formData.get('login_id'),
      user_name: formData.get('user_name'),
      password: formData.get('password') || undefined,
      status,
    }

    try {
      if (isUpdate) {
        await api.updateUser(user.id, body)
      } else {
        await api.createUser(body)
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
      <section className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="user-add-title">
        <div className="modal-header">
          <div>
            <h2 id="user-add-title">{modalTitle}</h2>
            <p>{apiLabel} の入力項目モック</p>
          </div>
          <button className="ghost-button" type="button" onClick={onClose}>閉じる</button>
        </div>

        <form className="modal-form" onSubmit={submit}>
          {companyEditable ? (
            <SelectField label="企業" value={companyId} onChange={changeCompany}>
              <option value="">企業なし</option>
              {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
            </SelectField>
          ) : (
            <div className="readonly-field">
              <span>企業</span>
              <strong>{getCompany(companyId)?.name}</strong>
            </div>
          )}

          {siteEditable ? (
            <SelectField label="現場" value={siteId} onChange={changeSite} disabled={!companyId}>
              <option value="">現場なし</option>
              {availableSites.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}
            </SelectField>
          ) : (
            <div className="readonly-field">
              <span>現場</span>
              <strong>{getSite(siteId)?.name}</strong>
            </div>
          )}

          <SelectField label="権限" value={selectedRole} onChange={setNewRole}>
            {roleOptions.map((roleId) => <option key={roleId} value={roleId}>{roleLabels[roleId]}</option>)}
          </SelectField>
          <InputField label="ログインID" name="login_id" type="text" defaultValue={user?.loginId ?? ''} disabled={isUpdate} />
          <InputField label="ユーザー名" name="user_name" type="text" defaultValue={user?.userName ?? ''} />
          {!isUpdate && <InputField label="初期パスワード" name="password" type="password" />}
          <SelectField label="状態" value={status} onChange={setStatus}>
            <option value="active">有効</option>
            <option value="inactive">一時停止</option>
          </SelectField>
          {isUpdate && (
            <div className="reset-area">
              <button className="ghost-button" type="button" onClick={resetPassword}>パスワードリセット</button>
              {resetMessage && <span>{resetMessage}</span>}
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
