import { useEffect, useState } from 'react'
import { Box, Button, Flex, Select, Text } from '@chakra-ui/react'
import { api } from './api'
import sensorixLogo from './assets/sensorix_logo.png'
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

const AUTH_USER_STORAGE_KEY = 'iot_platform_auth_user'

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

function readStoredAuthUser() {
  try {
    const storedUser = JSON.parse(sessionStorage.getItem(AUTH_USER_STORAGE_KEY))
    return storedUser && roleLabels[storedUser.roleId] ? storedUser : null
  } catch {
    return null
  }
}

function storeAuthUser(authUser) {
  sessionStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(authUser))
}

function clearStoredAuthUser() {
  sessionStorage.removeItem(AUTH_USER_STORAGE_KEY)
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isRestoringSession, setIsRestoringSession] = useState(true)
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
  const selectedDevice = getDevice(selectedDeviceId) ?? devices.find((device) => matchesFilter(device, filter)) ?? devices[0] ?? null

  useEffect(() => {
    async function restoreSession() {
      const token = api.getAuthToken()
      const tokenPayload = decodeJwtPayload(token)
      const storedUser = readStoredAuthUser()
      const authUser = storedUser ?? (tokenPayload ? normalizeAuthUser({ token }) : null)

      if (!token || !authUser) {
        api.clearAuthToken()
        clearStoredAuthUser()
        setIsRestoringSession(false)
        return
      }

      if (tokenPayload?.exp && tokenPayload.exp * 1000 <= Date.now()) {
        api.clearAuthToken()
        clearStoredAuthUser()
        setIsRestoringSession(false)
        return
      }

      updateRoleProfile(authUser.roleId, {
        loginId: authUser.loginId,
        companyId: authUser.companyId,
        siteId: authUser.siteId,
      })
      setRole(authUser.roleId)
      setIsLoadingData(true)

      try {
        await loadInitialData(authUser.roleId)
        const nextFilter = getScopeDefaults(authUser.roleId)
        setFilter(nextFilter)
        setSelectedDeviceId(devices.find((device) => matchesFilter(device, nextFilter))?.id ?? devices[0]?.id ?? '')
        setDataVersion((version) => version + 1)
        setIsLoggedIn(true)
      } catch (error) {
        api.clearAuthToken()
        clearStoredAuthUser()
        setAppError(formatApiError(error))
      } finally {
        setIsLoadingData(false)
        setIsRestoringSession(false)
      }
    }

    restoreSession()
  }, [])

  function applyFilter(nextFilter) {
    const normalized = normalizeFilter(role, nextFilter)
    setFilter(normalized)
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
      storeAuthUser({
        loginId: authUser.loginId,
        roleId: nextRole,
        companyId: loadedUser?.companyId ?? authUser.companyId,
        siteId: loadedUser?.siteId ?? authUser.siteId,
      })
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
      clearStoredAuthUser()
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

  if (isRestoringSession) {
    return (
      <Box className="login-screen" as="main">
        <Box width="min(560px, 100%)">
          <LoadingStrip>ログインセッションを復元しています...</LoadingStrip>
        </Box>
      </Box>
    )
  }

  if (!isLoggedIn) {
    return <LoginScreen error={appError} isSubmitting={isLoadingData} onClearError={clearAppError} onLogin={login} />
  }

  return (
    <Box className={isSidebarCollapsed ? 'app-shell sidebar-collapsed' : 'app-shell'}>
      <Box
        as="aside"
        className="sidebar"
        bg="linear-gradient(180deg, rgba(5,7,11,0.98) 0%, rgba(8,13,23,0.96) 100%)"
        borderRight="1px solid rgba(83, 111, 154, 0.24)"
        boxShadow="12px 0 40px rgba(0, 0, 0, 0.3)"
        backdropFilter="blur(22px)"
      >
        <Flex className="brand" align="center" gap="3">
          <img className="brand-logo" src={sensorixLogo} alt="Sensorix" />
          <Button
            aria-label={isSidebarCollapsed ? 'メニューを開く' : 'メニューを閉じる'}
            aria-expanded={!isSidebarCollapsed}
            className="sidebar-toggle"
            type="button"
            variant="ghost"
            onClick={() => setIsSidebarCollapsed((current) => !current)}
          >
            <span className="hamburger-icon" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </Button>
        </Flex>

        <nav className="side-menu" aria-label="メインメニュー">
          {visibleMenuGroups.map((group) => (
            <div className={group.id === 'maintenance' ? 'menu-group maintenance-group' : 'menu-group'} key={group.id}>
              {group.label && <p className="menu-group-label">{group.label}</p>}
              {group.items.map((item) => (
                <Button
                  className={item.id === activeScreen ? 'menu-button active' : 'menu-button'}
                  key={item.id}
                  title={isSidebarCollapsed ? item.label : undefined}
                  type="button"
                  variant="ghost"
                  justifyContent="flex-start"
                  onClick={() => setActiveScreen(item.id)}
                >
                  <Icon type={item.icon} />
                  <span>{item.label}</span>
                </Button>
              ))}
            </div>
          ))}
        </nav>
      </Box>

      <Box as="main" className="main-panel">
        <Flex
          as="header"
          className="topbar"
          bg="rgba(8, 13, 23, 0.82)"
          borderBottom="1px solid rgba(83, 111, 154, 0.22)"
          backdropFilter="blur(24px)"
        >
          <Box>
            <p className="eyebrow">Asia/Tokyo / API base: /api/v1</p>
            <h1>{activeLabel}</h1>
          </Box>
          <Flex className="user-box" align="center" gap="3" wrap="wrap">
            <label className="role-switcher">
              <span>権限</span>
              <Select value={role} disabled maxW="180px" onChange={(event) => changeRole(event.target.value)}>
                {Object.entries(roleLabels).map(([roleId, label]) => (
                  <option key={roleId} value={roleId}>{label}</option>
                ))}
              </Select>
            </label>
            <Text>ログイン: {roleProfiles[role].loginId}</Text>
            <Button type="button" variant="outline" onClick={logout}>ログアウト</Button>
          </Flex>
        </Flex>

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
      </Box>
    </Box>
  )
}

function Screen(props) {
  const { id, selectedDevice, onNavigate } = props

  if (id === 'devices') return <DevicesScreen {...props} />
  if (id === 'device_graph') return (
    <DeviceGraphScreen
      {...props}
      key={selectedDevice?.id ?? 'no-device'}
      device={selectedDevice}
      onBack={() => onNavigate('devices')}
    />
  )
  if (id === 'company_settings') return <CompanySettingsScreen {...props} />
  if (id === 'site_settings') return <SiteSettingsScreen {...props} />
  if (id === 'user_settings') return <UsersScreen {...props} />
  if (id === 'device_settings') return <DeviceSettingsScreen {...props} />
  if (id === 'threshold_settings') return <ThresholdScreen {...props} />
  if (id === 'audit_logs') return <AuditLogScreen {...props} />
  return <DashboardScreen {...props} />
}

export default App
