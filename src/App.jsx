import { useState } from 'react'
import { api } from './api'
import { ApiErrorBanner, LoadingStrip } from './components/Feedback'
import { Icon } from './components/Icon'
import { menuGroups, menuItems, menuVisibility, roleLabels, roleProfiles, updateRoleProfile } from './data/constants'
import { devices, users } from './data/store'
import { AuditLogScreen } from './screens/AuditLogScreen'
import { CompanySettingsScreen } from './screens/CompanySettingsScreen'
import { DashboardScreen } from './screens/DashboardScreen'
import { DeviceGraphScreen } from './screens/DeviceGraphScreen'
import { DeviceSettingsScreen } from './screens/DeviceSettingsScreen'
import { DevicesScreen } from './screens/DevicesScreen'
import { LoginScreen } from './screens/LoginScreen'
import { SiteSettingsScreen } from './screens/SiteSettingsScreen'
import { ThresholdScreen } from './screens/ThresholdScreen'
import { UsersScreen } from './screens/UsersScreen'
import { formatApiError, getDevice, getScopeDefaults, loadInitialData, matchesFilter, normalizeFilter } from './services/domain'
import './App.css'

function decodeJwtPayload(token) {
  if (!token || typeof token !== 'string' || token.split('.').length < 2) return null

  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(window.atob(payload))
  } catch {
    return null
  }
}

function pickAuthSource(result) {
  return result?.user ?? result?.profile ?? result?.account ?? result?.auth_user ?? result ?? {}
}

function normalizeAuthUser(result, loginId) {
  const tokenPayload = decodeJwtPayload(result?.token)
  const source = {
    ...tokenPayload,
    ...pickAuthSource(result),
  }
  const roleId = source.roleId ?? source.role_id ?? source.role ?? source.user_role
  const companyId = source.companyId ?? source.company_id ?? source.company ?? null
  const siteId = source.siteId ?? source.site_id ?? source.site ?? null

  return {
    loginId: source.loginId ?? source.login_id ?? source.username ?? loginId,
    roleId: roleLabels[roleId] ? roleId : 'system_admin',
    hasRole: Boolean(roleLabels[roleId]),
    companyId: companyId == null ? null : String(companyId),
    siteId: siteId == null ? null : String(siteId),
  }
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [activeScreen, setActiveScreen] = useState('dashboard')
  const [role, setRole] = useState('system_admin')
  const [filter, setFilter] = useState(getScopeDefaults('system_admin'))
  const [selectedDeviceId, setSelectedDeviceId] = useState(devices[0]?.id ?? '')
  const [, setDataVersion] = useState(0)
  const [appError, setAppError] = useState('')
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  const allowedMenuIds = menuVisibility[role]
  const visibleMenuItems = menuItems.filter((item) => allowedMenuIds.includes(item.id))
  const visibleMenuGroups = menuGroups
    .map((group) => ({
      ...group,
      items: visibleMenuItems.filter((item) => item.group === group.id),
    }))
    .filter((group) => group.items.length > 0)
  const activeLabel = activeScreen === 'device_graph'
    ? '時系列グラフ'
    : menuItems.find((item) => item.id === activeScreen)?.label
  const filteredDevice = filter.deviceId !== 'all' ? getDevice(filter.deviceId) : null
  const selectedDevice = filteredDevice ?? getDevice(selectedDeviceId) ?? devices[0] ?? null

  function applyFilter(nextFilter) {
    const normalized = normalizeFilter(role, nextFilter)
    setFilter(normalized)
    if (normalized.deviceId !== 'all') setSelectedDeviceId(normalized.deviceId)
  }

  function changeRole(nextRole) {
    const nextFilter = getScopeDefaults(nextRole)
    const fallbackScreen = menuVisibility[nextRole].includes(activeScreen) ? activeScreen : 'dashboard'
    setRole(nextRole)
    setFilter(nextFilter)
    setActiveScreen(fallbackScreen)
    setSelectedDeviceId(devices.find((device) => matchesFilter(device, nextFilter))?.id ?? devices[0]?.id ?? '')
  }

  async function login(credentials) {
    setAppError('')
    const loginResult = await api.login(credentials)
    const authUser = normalizeAuthUser(loginResult, credentials.login_id)
    let nextRole = authUser.roleId
    updateRoleProfile(nextRole, {
      loginId: authUser.loginId,
      companyId: authUser.companyId,
      siteId: authUser.siteId,
    })
    setRole(nextRole)
    setIsLoadingData(true)
    try {
      await loadInitialData(nextRole)
      const loadedUser = users.find((user) => user.loginId === authUser.loginId)
      if (!authUser.hasRole && roleLabels[loadedUser?.roleId]) {
        nextRole = loadedUser.roleId
        updateRoleProfile(nextRole, {
          loginId: loadedUser.loginId,
          companyId: loadedUser.companyId,
          siteId: loadedUser.siteId,
        })
        setRole(nextRole)
      }
      const nextFilter = getScopeDefaults(nextRole)
      setFilter(nextFilter)
      setSelectedDeviceId(devices.find((device) => matchesFilter(device, nextFilter))?.id ?? devices[0]?.id ?? '')
      setDataVersion((version) => version + 1)
      setActiveScreen('dashboard')
      setIsLoggedIn(true)
    } catch (error) {
      setAppError(formatApiError(error))
      throw error
    } finally {
      setIsLoadingData(false)
    }
  }

  async function logout() {
    setAppError('')
    try {
      await api.logout()
    } catch (error) {
      setAppError(formatApiError(error))
    } finally {
      setActiveScreen('dashboard')
      setIsLoggedIn(false)
    }
  }

  function refreshDataVersion() {
    setDataVersion((version) => version + 1)
  }

  function clearAppError() {
    setAppError('')
  }

  if (!isLoggedIn) {
    return <LoginScreen error={appError} isSubmitting={isLoadingData} onClearError={clearAppError} onLogin={login} />
  }

  return (
    <div className={isSidebarCollapsed ? 'app-shell sidebar-collapsed' : 'app-shell'}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">IP</div>
          <div className="brand-copy">
            <strong>iot_platform</strong>
            <span>authority scoped mock</span>
          </div>
          <button
            aria-label={isSidebarCollapsed ? 'メニューを開く' : 'メニューを閉じる'}
            aria-expanded={!isSidebarCollapsed}
            className="sidebar-toggle"
            type="button"
            onClick={() => setIsSidebarCollapsed((current) => !current)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>

        <nav className="side-menu" aria-label="メインメニュー">
          {visibleMenuGroups.map((group) => (
            <div className={group.id === 'maintenance' ? 'menu-group maintenance-group' : 'menu-group'} key={group.id}>
              {group.label && <p className="menu-group-label">{group.label}</p>}
              {group.items.map((item) => (
                <button
                  className={item.id === activeScreen ? 'menu-button active' : 'menu-button'}
                  key={item.id}
                  title={isSidebarCollapsed ? item.label : undefined}
                  type="button"
                  onClick={() => setActiveScreen(item.id)}
                >
                  <Icon type={item.icon} />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div>
            <p className="eyebrow">Asia/Tokyo / API base: /api/v1</p>
            <h1>{activeLabel}</h1>
          </div>
          <div className="user-box">
            <label className="role-switcher">
              <span>権限</span>
              <select value={role} disabled onChange={(event) => changeRole(event.target.value)}>
                {Object.entries(roleLabels).map(([roleId, label]) => (
                  <option key={roleId} value={roleId}>{label}</option>
                ))}
              </select>
            </label>
            <span>ログイン: {roleProfiles[role].loginId}</span>
            <button type="button" onClick={logout}>ログアウト</button>
          </div>
        </header>

        {appError && <ApiErrorBanner message={appError} onClose={() => setAppError('')} />}
        {isLoadingData && <LoadingStrip />}
        <Screen
          id={activeScreen}
          role={role}
          filter={filter}
          onFilterChange={applyFilter}
          selectedDevice={selectedDevice}
          selectedDeviceId={selectedDeviceId}
          onSelectDevice={setSelectedDeviceId}
          onNavigate={setActiveScreen}
          onDataChanged={refreshDataVersion}
          onError={(message) => setAppError(message)}
        />
      </main>
    </div>
  )
}

function Screen(props) {
  const { id, selectedDevice, onNavigate } = props

  if (id === 'devices') return <DevicesScreen {...props} />
  if (id === 'device_graph') return <DeviceGraphScreen {...props} device={selectedDevice} onBack={() => onNavigate('devices')} />
  if (id === 'company_settings') return <CompanySettingsScreen {...props} />
  if (id === 'site_settings') return <SiteSettingsScreen {...props} />
  if (id === 'user_settings') return <UsersScreen {...props} />
  if (id === 'device_settings') return <DeviceSettingsScreen {...props} />
  if (id === 'threshold_settings') return <ThresholdScreen {...props} />
  if (id === 'audit_logs') return <AuditLogScreen {...props} />
  return <DashboardScreen {...props} />
}

export default App
