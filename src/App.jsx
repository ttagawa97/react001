import { useState } from 'react'
import { api } from './api'
import { ApiErrorBanner, LoadingStrip } from './components/Feedback'
import { Icon } from './components/Icon'
import { menuItems, menuVisibility, roleLabels, roleProfiles } from './data/constants'
import { devices } from './data/store'
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

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [activeScreen, setActiveScreen] = useState('dashboard')
  const [role, setRole] = useState('system_admin')
  const [filter, setFilter] = useState(getScopeDefaults('system_admin'))
  const [selectedDeviceId, setSelectedDeviceId] = useState(devices[0]?.id ?? '')
  const [, setDataVersion] = useState(0)
  const [appError, setAppError] = useState('')
  const [isLoadingData, setIsLoadingData] = useState(false)

  const allowedMenuIds = menuVisibility[role]
  const visibleMenuItems = menuItems.filter((item) => allowedMenuIds.includes(item.id))
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
    await api.login(credentials)
    setIsLoadingData(true)
    try {
      await loadInitialData()
      const nextFilter = getScopeDefaults(role)
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
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">IP</div>
          <div>
            <strong>iot_platform</strong>
            <span>authority scoped mock</span>
          </div>
        </div>

        <nav className="side-menu" aria-label="メインメニュー">
          {visibleMenuItems.map((item) => (
            <button
              className={item.id === activeScreen ? 'menu-button active' : 'menu-button'}
              key={item.id}
              type="button"
              onClick={() => setActiveScreen(item.id)}
            >
              <Icon type={item.icon} />
              <span>{item.label}</span>
            </button>
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
