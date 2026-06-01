import { useMemo, useState } from 'react'
import './App.css'

const menuItems = [
  { id: 'dashboard', label: 'ダッシュボード', icon: 'grid' },
  { id: 'devices', label: 'デバイス一覧', icon: 'device' },
  { id: 'site_settings', label: '現場設定', icon: 'site' },
  { id: 'user_settings', label: 'ユーザー設定', icon: 'user' },
  { id: 'device_settings', label: 'デバイス設定', icon: 'tune' },
  { id: 'threshold_settings', label: '閾値設定', icon: 'alert' },
  { id: 'audit_logs', label: '監査ログ', icon: 'log' },
]

const roleLabels = {
  system_admin: 'システム管理者',
  company_admin: '企業管理者',
  site_admin: '現場管理者',
  general_user: '一般ユーザー',
}

const assignableRoles = {
  system_admin: ['system_admin', 'company_admin', 'site_admin', 'general_user'],
  company_admin: ['company_admin', 'site_admin', 'general_user'],
  site_admin: ['site_admin', 'general_user'],
}

const roleProfiles = {
  system_admin: { loginId: 'sys-admin', companyId: null, siteId: null },
  company_admin: { loginId: 'minato-admin', companyId: 'co-minato', siteId: null },
  site_admin: { loginId: 'cold-lead', companyId: 'co-minato', siteId: 'st-cold' },
  general_user: { loginId: 'cold-viewer', companyId: 'co-minato', siteId: 'st-cold' },
}

const menuVisibility = {
  system_admin: menuItems.map((item) => item.id),
  company_admin: ['dashboard', 'devices', 'site_settings', 'user_settings', 'device_settings', 'threshold_settings', 'audit_logs'],
  site_admin: ['dashboard', 'devices', 'user_settings', 'device_settings', 'threshold_settings', 'audit_logs'],
  general_user: ['dashboard', 'devices'],
}

const companies = [
  { id: 'co-minato', name: '南港食品', sites: ['st-cold', 'st-line'] },
  { id: 'co-toto', name: '東都設備', sites: ['st-tank', 'st-energy'] },
]

const sites = [
  { id: 'st-cold', companyId: 'co-minato', name: '冷蔵倉庫A', address: '大阪市住之江区', status: '有効' },
  { id: 'st-line', companyId: 'co-minato', name: '乾燥ライン1', address: '堺市堺区', status: '有効' },
  { id: 'st-tank', companyId: 'co-toto', name: '屋外タンクヤード', address: '東京都大田区', status: '有効' },
  { id: 'st-energy', companyId: 'co-toto', name: '第2受電室', address: '川崎市川崎区', status: '有効' },
]

const devices = [
  {
    id: 'DV-1001',
    name: '冷蔵倉庫 A 温湿度',
    companyId: 'co-minato',
    siteId: 'st-cold',
    status: 'online',
    authId: 'auth-dv-1001',
    inputType: 'json',
    csvHeaderMode: '-',
    latestReceivedAt: '2026-05-28 09:12:40',
    alert: '正常',
    columns: [
      {
        key: 'temperature',
        label: '温度',
        unit: 'C',
        type: 'number',
        weight: 1,
        order: 1,
        thresholds: [{ id: 'th-1', name: '冷蔵温度範囲', upper: 8, lower: -2, suppress: 30 }],
        values: [4.1, 4.2, 4.4, 4.3, 4.7, 5.0, 5.4, 5.1, 4.9, 4.6, 4.3, 4.2],
      },
      {
        key: 'humidity',
        label: '湿度',
        unit: '%',
        type: 'number',
        weight: 1,
        order: 2,
        thresholds: [{ id: 'th-2', name: '倉庫湿度範囲', upper: 75, lower: 35, suppress: 30 }],
        values: [58, 60, 62, 61, 64, 63, 65, 67, 66, 64, 62, 61],
      },
    ],
  },
  {
    id: 'DV-1002',
    name: '乾燥ライン 圧力',
    companyId: 'co-minato',
    siteId: 'st-line',
    status: 'warning',
    authId: 'auth-dv-1002',
    inputType: 'csv',
    csvHeaderMode: 'header_exists',
    latestReceivedAt: '2026-05-28 09:12:18',
    alert: '上限超過',
    columns: [
      {
        key: 'pressure',
        label: '圧力',
        unit: 'MPa',
        type: 'number',
        weight: 1000,
        order: 1,
        thresholds: [{ id: 'th-3', name: '乾燥ライン圧力', upper: 1.1, lower: 0.4, suppress: 10 }],
        values: [0.52, 0.58, 0.64, 0.71, 0.76, 0.82, 0.88, 0.96, 1.12, 1.05, 0.98, 0.92],
      },
      {
        key: 'running',
        label: '運転中',
        unit: '',
        type: 'boolean',
        weight: 1,
        order: 2,
        thresholds: [],
        values: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      },
    ],
  },
  {
    id: 'DV-2044',
    name: '屋外タンク 水位',
    companyId: 'co-toto',
    siteId: 'st-tank',
    status: 'offline',
    authId: 'auth-dv-2044',
    inputType: 'json',
    csvHeaderMode: '-',
    latestReceivedAt: '2026-05-28 08:48:03',
    alert: '通信断',
    columns: [
      {
        key: 'water_level',
        label: '水位',
        unit: 'cm',
        type: 'number',
        weight: 0.1,
        order: 1,
        thresholds: [{ id: 'th-4', name: 'タンク水位', upper: 95, lower: 20, suppress: 60 }],
        values: [70, 71, 72, 73, 73, 74, 73, 72, 72, 72, 72, 72],
      },
    ],
  },
  {
    id: 'DV-3188',
    name: '電力量メーター B',
    companyId: 'co-toto',
    siteId: 'st-energy',
    status: 'online',
    authId: 'auth-dv-3188',
    inputType: 'json',
    csvHeaderMode: '-',
    latestReceivedAt: '2026-05-28 09:12:59',
    alert: '正常',
    columns: [
      {
        key: 'power',
        label: '電力',
        unit: 'kWh',
        type: 'number',
        weight: 1,
        order: 1,
        thresholds: [{ id: 'th-5', name: '受電室電力量', upper: 18, lower: 0, suppress: 20 }],
        values: [9.2, 9.8, 10.4, 11.6, 12.1, 13.3, 14.0, 13.8, 13.4, 13.1, 12.9, 12.8],
      },
    ],
  },
]

const users = [
  { id: 'u-1', loginId: 'sys-admin', userName: 'システム管理者', roleId: 'system_admin', companyId: null, siteId: null, scope: '全企業 / 全現場', status: '有効' },
  { id: 'u-2', loginId: 'minato-admin', userName: '南港食品 管理者', roleId: 'company_admin', companyId: 'co-minato', siteId: null, scope: '南港食品 / 全現場', status: '有効' },
  { id: 'u-3', loginId: 'cold-lead', userName: '冷蔵倉庫 現場管理者', roleId: 'site_admin', companyId: 'co-minato', siteId: 'st-cold', scope: '南港食品 / 冷蔵倉庫A', status: '有効' },
  { id: 'u-4', loginId: 'cold-viewer', userName: '冷蔵倉庫 一般ユーザー', roleId: 'general_user', companyId: 'co-minato', siteId: 'st-cold', scope: '南港食品 / 冷蔵倉庫A', status: '有効' },
]

const auditLogs = [
  { at: '2026-05-28 09:04:12', user: 'minato-admin', companyId: 'co-minato', siteId: 'st-cold', action: 'threshold_setting_changed', target: 'DV-1001 / temperature' },
  { at: '2026-05-28 08:52:48', user: 'sys-admin', companyId: 'co-toto', siteId: 'st-energy', action: 'site_setting_changed', target: '東都設備 / 第2受電室' },
  { at: '2026-05-28 08:41:03', user: 'cold-lead', companyId: 'co-minato', siteId: 'st-line', action: 'device_setting_changed', target: 'DV-1002' },
  { at: '2026-05-28 08:18:29', user: 'cold-viewer', companyId: 'co-minato', siteId: 'st-cold', action: 'user_setting_changed', target: 'cold-viewer' },
]

const graphPoints = [38, 45, 42, 58, 61, 54, 68, 64, 71, 76, 73, 82]

const statusLabels = {
  online: '稼働',
  warning: '警告',
  offline: '切断',
}

function getCompany(companyId) {
  return companies.find((company) => company.id === companyId)
}

function getSite(siteId) {
  return sites.find((site) => site.id === siteId)
}

function getDevice(deviceId) {
  return devices.find((device) => device.id === deviceId)
}

function getScopeDefaults(role) {
  const profile = roleProfiles[role]
  return {
    companyId: profile.companyId ?? 'all',
    siteId: profile.siteId ?? 'all',
    deviceId: 'all',
  }
}

function normalizeFilter(role, nextFilter) {
  const profile = roleProfiles[role]
  const companyId = profile.companyId ?? nextFilter.companyId ?? 'all'
  const siteId = profile.siteId ?? nextFilter.siteId ?? 'all'
  let deviceId = nextFilter.deviceId ?? 'all'

  if (deviceId !== 'all') {
    const device = getDevice(deviceId)
    const invalidCompany = companyId !== 'all' && device?.companyId !== companyId
    const invalidSite = siteId !== 'all' && device?.siteId !== siteId
    if (!device || invalidCompany || invalidSite) deviceId = 'all'
  }

  return { companyId, siteId, deviceId }
}

function matchesFilter(item, filter) {
  const itemCompanyId = item.companyId
  const itemSiteId = item.siteId
  const itemDeviceId = item.deviceId ?? item.id

  return (
    (filter.companyId === 'all' || itemCompanyId === filter.companyId) &&
    (filter.siteId === 'all' || itemSiteId === filter.siteId) &&
    (filter.deviceId === 'all' || itemDeviceId === filter.deviceId)
  )
}

function getLatestValues(device) {
  return device.columns
    .map((column) => {
      const latest = getDisplayValue(column, column.values.at(-1))
      return `${column.label} ${latest}${column.unit ? ` ${column.unit}` : ''}`
    })
    .join(' / ')
}

function getDisplayValue(column, rawValue) {
  if (column.type !== 'number' || typeof rawValue !== 'number') return rawValue
  const weightedValue = rawValue * (column.weight ?? 1)
  return Number.isInteger(weightedValue) ? weightedValue : Number(weightedValue.toFixed(3))
}

function getRawValues(column) {
  return column.values
}

function getDisplayValues(column) {
  return column.values.map((value) => getDisplayValue(column, value))
}

function getThresholdRows(sourceDevices = devices) {
  return sourceDevices.flatMap((device) => {
    const company = getCompany(device.companyId)
    const site = getSite(device.siteId)

    return device.columns.flatMap((column) => (
      column.thresholds.map((threshold) => ({
        id: threshold.id,
        companyId: device.companyId,
        siteId: device.siteId,
        deviceId: device.id,
        columnKey: column.key,
        cells: [
          company?.name,
          site?.name,
          device.name,
          `${column.label} (${column.key})`,
          threshold.name,
          threshold.lower ?? '-',
          threshold.upper ?? '-',
          'ops@example.com, admin@example.com',
          `${threshold.suppress}分`,
        ],
      }))
    ))
  })
}

function getUserAddRoleOptions(operatorRole, companyId, siteId) {
  let scopeRoles = []

  if (!companyId && !siteId) {
    scopeRoles = ['system_admin']
  } else if (companyId && !siteId) {
    scopeRoles = ['company_admin']
  } else if (companyId && siteId) {
    scopeRoles = ['site_admin', 'general_user']
  }

  const operatorRoles = assignableRoles[operatorRole] ?? []
  return scopeRoles.filter((roleId) => operatorRoles.includes(roleId))
}

function Icon({ type }) {
  const icons = {
    grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
    device: 'M6 4h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm3 16h6',
    site: 'M4 20V9l8-5 8 5v11M9 20v-6h6v6M4 20h16',
    user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 8a7 7 0 0 1 14 0',
    tune: 'M4 7h10M18 7h2M4 17h2M10 17h10M14 5v4M8 15v4',
    alert: 'M12 4 3 20h18L12 4zm0 5v5m0 3h.01',
    log: 'M5 4h14v16H5zM8 8h8M8 12h8M8 16h5',
  }

  return (
    <svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d={icons[type]} />
    </svg>
  )
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [activeScreen, setActiveScreen] = useState('dashboard')
  const [role, setRole] = useState('system_admin')
  const [filter, setFilter] = useState(getScopeDefaults('system_admin'))
  const [selectedDeviceId, setSelectedDeviceId] = useState(devices[0].id)

  const allowedMenuIds = menuVisibility[role]
  const visibleMenuItems = menuItems.filter((item) => allowedMenuIds.includes(item.id))
  const activeLabel = activeScreen === 'device_graph'
    ? '時系列グラフ'
    : menuItems.find((item) => item.id === activeScreen)?.label

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
    setSelectedDeviceId(devices.find((device) => matchesFilter(device, nextFilter))?.id ?? devices[0].id)
  }

  const selectedDevice = useMemo(() => {
    const filteredDevice = filter.deviceId !== 'all' ? getDevice(filter.deviceId) : null
    return filteredDevice ?? getDevice(selectedDeviceId) ?? devices[0]
  }, [filter.deviceId, selectedDeviceId])

  function login() {
    setActiveScreen('dashboard')
    setIsLoggedIn(true)
  }

  function logout() {
    setActiveScreen('dashboard')
    setIsLoggedIn(false)
  }

  if (!isLoggedIn) {
    return <LoginScreen onLogin={login} />
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
              <select value={role} onChange={(event) => changeRole(event.target.value)}>
                {Object.entries(roleLabels).map(([roleId, label]) => (
                  <option key={roleId} value={roleId}>{label}</option>
                ))}
              </select>
            </label>
            <span>ログイン: {roleProfiles[role].loginId}</span>
            <button type="button" onClick={logout}>ログアウト</button>
          </div>
        </header>

        <Screen
          id={activeScreen}
          role={role}
          filter={filter}
          onFilterChange={applyFilter}
          selectedDevice={selectedDevice}
          selectedDeviceId={selectedDeviceId}
          onSelectDevice={setSelectedDeviceId}
          onNavigate={setActiveScreen}
        />
      </main>
    </div>
  )
}

function LoginScreen({ onLogin }) {
  const [mode, setMode] = useState('login')
  const isResetMode = mode === 'password_reset'

  return (
    <main className="login-screen">
      <section className="login-card" aria-label="ログイン">
        <div className="login-brand">
          <div className="brand-mark">IP</div>
          <div>
            <strong>iot_platform</strong>
            <span>{isResetMode ? 'password reset flow' : 'simple admin console'}</span>
          </div>
        </div>
        {isResetMode ? (
          <form
            className="login-form"
            onSubmit={(event) => {
              event.preventDefault()
              setMode('login')
            }}
          >
            <label>
              <span>ログインID</span>
              <input type="text" autoComplete="username" />
            </label>
            <label>
              <span>新しいパスワード</span>
              <input type="password" autoComplete="new-password" />
            </label>
            <label>
              <span>新しいパスワード確認</span>
              <input type="password" autoComplete="new-password" />
            </label>
            <button type="submit">パスワードを変更</button>
            <button className="text-button" type="button" onClick={() => setMode('login')}>
              ログイン画面へ戻る
            </button>
          </form>
        ) : (
          <form
            className="login-form"
            onSubmit={(event) => {
              event.preventDefault()
              onLogin()
            }}
          >
            <label>
              <span>ログインID</span>
              <input type="text" autoComplete="username" />
            </label>
            <label>
              <span>パスワード</span>
              <input type="password" autoComplete="current-password" />
            </label>
            <button type="submit">ログイン</button>
            <button className="text-button" type="button" onClick={() => setMode('password_reset')}>
              パスワード再発行
            </button>
          </form>
        )}
      </section>
    </main>
  )
}

function Screen(props) {
  const { id, selectedDevice, onNavigate } = props

  if (id === 'devices') return <DevicesScreen {...props} />
  if (id === 'device_graph') return <DeviceGraphScreen {...props} device={selectedDevice} onBack={() => onNavigate('devices')} />
  if (id === 'site_settings') return <SiteSettingsScreen {...props} />
  if (id === 'user_settings') return <UsersScreen {...props} />
  if (id === 'device_settings') return <DeviceSettingsScreen {...props} />
  if (id === 'threshold_settings') return <ThresholdScreen {...props} />
  if (id === 'audit_logs') return <AuditLogScreen {...props} />
  return <DashboardScreen {...props} />
}

function DashboardScreen({ role, filter, onFilterChange }) {
  const filteredDevices = devices.filter((device) => matchesFilter(device, filter))
  const filteredSites = sites.filter((site) => (
    (filter.companyId === 'all' || site.companyId === filter.companyId) &&
    (filter.siteId === 'all' || site.id === filter.siteId)
  ))
  const normalDevices = filteredDevices.filter((device) => device.status === 'online').length
  const disconnectedDevices = filteredDevices.filter((device) => device.status === 'offline').length
  const alertDevices = filteredDevices.filter((device) => device.alert !== '正常').length
  const metrics = [
    { label: '現場数', value: filteredSites.length, detail: '現在の権限・絞り込み範囲' },
    { label: '総デバイス数', value: filteredDevices.length, detail: '現場配下の設置端末' },
    { label: '正常台数', value: normalDevices, detail: '最新値が正常範囲内' },
    { label: '通信断台数', value: disconnectedDevices, detail: '欠落2回以上で検知' },
    { label: 'アラート台数', value: alertDevices, detail: '閾値または通信状態' },
  ]

  return (
    <div className="screen-stack">
      <CommonFilter role={role} filter={filter} onChange={onFilterChange} />
      <section className="metric-grid">
        {metrics.map((metric) => (
          <article className="metric-card" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <p>{metric.detail}</p>
          </article>
        ))}
      </section>

      <section className="content-grid">
        <article className="panel wide">
          <PanelHeader title="時系列グラフ" detail="表示期間に応じて parsed_data / 1min / 1hour を切替" />
          <div className="chart" aria-label="時系列グラフのモック">
            {graphPoints.map((point, index) => (
              <span
                className="chart-bar"
                key={`${point}-${index}`}
                style={{ height: `${point}%` }}
                title={`${index + 1}: ${point}`}
              />
            ))}
          </div>
        </article>

        <article className="panel">
          <PanelHeader title="権限制御" detail="フィルタはログインユーザー範囲に固定" />
          <ol className="hierarchy-list">
            <li>企業</li>
            <li>現場</li>
            <li>デバイス</li>
            <li>データ項目</li>
            <li>閾値</li>
          </ol>
        </article>
      </section>

      <DeviceTable rows={filteredDevices.slice(0, 3)} />
    </div>
  )
}

function DevicesScreen({ role, filter, onFilterChange, selectedDeviceId, onSelectDevice, onNavigate }) {
  const filteredDevices = devices.filter((device) => matchesFilter(device, filter))

  return (
    <div className="screen-stack">
      <Toolbar title="現場別・デバイス別の最新値" action="更新" detail="企業・現場・デバイスの共通絞り込みで表示範囲を制御します。" />
      <CommonFilter role={role} filter={filter} onChange={onFilterChange} />
      <DeviceTable
        rows={filteredDevices}
        selectedDeviceId={selectedDeviceId}
        onSelectDevice={onSelectDevice}
        onOpenDevice={(device) => {
          onSelectDevice(device.id)
          onFilterChange({ companyId: device.companyId, siteId: device.siteId, deviceId: device.id })
          onNavigate('device_graph')
        }}
      />
    </div>
  )
}

function DeviceGraphScreen({ role, filter, onFilterChange, device, onBack }) {
  const [period, setPeriod] = useState('24h')
  const company = getCompany(device.companyId)
  const site = getSite(device.siteId)

  return (
    <div className="screen-stack">
      <div className="toolbar graph-toolbar">
        <div>
          <h2>{device.name}</h2>
          <p>{device.id} / {company?.name} / {site?.name}</p>
        </div>
        <div className="toolbar-actions">
          <button type="button" onClick={onBack}>一覧へ戻る</button>
          <button type="button">表示</button>
        </div>
      </div>

      <CommonFilter role={role} filter={filter} onChange={onFilterChange} />

      <FilterPanel>
        <SelectField label="表示期間" value={period} onChange={setPeriod}>
          <option value="1m">1分</option>
          <option value="10m">10分</option>
          <option value="1h">1時間</option>
          <option value="12h">12時間</option>
          <option value="24h">24時間</option>
          <option value="3d">3日</option>
          <option value="7d">7日</option>
          <option value="2w">2週間</option>
          <option value="1month">1ヶ月</option>
          <option value="3months">3ヶ月</option>
          <option value="6months">6ヶ月</option>
          <option value="1year">1年</option>
          <option value="custom">期間指定</option>
        </SelectField>
        {period === 'custom' && (
          <>
            <InputField label="開始日時" type="datetime-local" defaultValue="2026-05-28T00:00" />
            <InputField label="終了日時" type="datetime-local" defaultValue="2026-05-28T23:59" />
          </>
        )}
      </FilterPanel>

      <section className="graph-summary">
        <article className="metric-card compact">
          <span>通信状態</span>
          <strong><StatusBadge status={device.status} /></strong>
          <p>最終受信 {device.latestReceivedAt}</p>
        </article>
        <article className="metric-card compact">
          <span>最新値</span>
          <strong>{getLatestValues(device)}</strong>
          <p>GET /devices/{device.id}/graph</p>
        </article>
        <article className="metric-card compact">
          <span>閾値状態</span>
          <strong>{device.alert}</strong>
          <p>カラム別に閾値線と超過点を表示</p>
        </article>
      </section>

      <section className="graph-stack">
        {device.columns.map((column) => (
          <TimeSeriesPanel column={column} key={column.key} />
        ))}
      </section>
    </div>
  )
}

function SiteSettingsScreen({ role, filter, onFilterChange }) {
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
          onClose={() => setIsAddOpen(false)}
        />
      )}
    </div>
  )
}

function UsersScreen({ role, filter, onFilterChange }) {
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
          onClose={() => setUserFormState(null)}
        />
      )}
    </div>
  )
}

function DeviceSettingsScreen({ role, filter, onFilterChange }) {
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
          onClose={() => setDeviceFormState(null)}
        />
      )}
    </div>
  )
}

function ThresholdScreen({ role, filter, onFilterChange }) {
  const scopedDevices = devices.filter((device) => matchesFilter(device, filter))
  const selectedDevice = filter.deviceId !== 'all' ? getDevice(filter.deviceId) : scopedDevices[0]
  const [columnKey, setColumnKey] = useState(selectedDevice?.columns[0]?.key ?? '')
  const availableColumns = selectedDevice?.columns ?? []
  const safeColumnKey = availableColumns.some((column) => column.key === columnKey)
    ? columnKey
    : availableColumns[0]?.key ?? ''
  const rows = getThresholdRows(scopedDevices).filter((row) => (
    !safeColumnKey || row.columnKey === safeColumnKey
  ))

  return (
    <div className="screen-stack">
      <Toolbar title="閾値設定" action="閾値を追加" detail="共通絞り込みにカラム選択を追加し、データ項目単位で閾値を管理します。" />
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
    </div>
  )
}

function AuditLogScreen({ role, filter, onFilterChange }) {
  const rows = auditLogs
    .filter((log) => matchesFilter({ ...log, deviceId: 'all' }, { ...filter, deviceId: 'all' }))
    .map((log) => [log.at, log.user, log.action, log.target])

  return (
    <div className="screen-stack">
      <Toolbar title="監査ログ" action="CSV出力" detail="設定変更イベントを企業・現場スコープで記録します。" />
      <CommonFilter role={role} filter={filter} onChange={onFilterChange} />
      <Table headers={['日時', 'ユーザー', '操作', '対象']} rows={rows} />
    </div>
  )
}

function CommonFilter({ role, filter, onChange }) {
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

function Toolbar({ title, action, detail = 'モックデータで画面構成を確認できます。', onAction }) {
  return (
    <div className="toolbar">
      <div>
        <h2>{title}</h2>
        <p>{detail}</p>
      </div>
      <button type="button" onClick={onAction}>{action}</button>
    </div>
  )
}

function SiteAddModal({ role, filter, onClose }) {
  const profile = roleProfiles[role]
  const fixedCompanyId = profile.companyId ?? (filter.companyId === 'all' ? companies[0].id : filter.companyId)
  const [companyId, setCompanyId] = useState(fixedCompanyId)
  const showCompanySelect = role === 'system_admin'

  function submit(event) {
    event.preventDefault()
    onClose()
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
          <InputField label="現場名" type="text" />
          <InputField label="住所" type="text" />
          <div className="modal-actions">
            <button className="ghost-button" type="button" onClick={onClose}>キャンセル</button>
            <button type="submit">保存</button>
          </div>
        </form>
      </section>
    </div>
  )
}

function UserFormModal({ role, mode, user, onClose }) {
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

  function resetPassword() {
    setResetMessage('パスワードリセット要求を受け付けました')
  }

  function submit(event) {
    event.preventDefault()
    onClose()
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
          <InputField label="ログインID" type="text" defaultValue={user?.loginId ?? ''} disabled={isUpdate} />
          <InputField label="ユーザー名" type="text" defaultValue={user?.userName ?? ''} />
          {!isUpdate && <InputField label="初期パスワード" type="password" />}
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

function DeviceFormModal({ role, mode, device, onClose }) {
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

  function submit(event) {
    event.preventDefault()
    onClose()
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

            <InputField label="デバイス名" type="text" defaultValue={device?.name ?? ''} />
            <InputField label="デバイスID" type="text" defaultValue={device?.id ?? ''} disabled={isUpdate} />
            <InputField label="認証ID" type="text" defaultValue={device?.authId ?? ''} />
            <InputField label={isUpdate ? '認証パスワード（入力時のみ上書き）' : '認証パスワード'} type="password" />
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
                  <input defaultValue={column.key} />
                  <input defaultValue={column.label} />
                  <select defaultValue={column.type}>
                    <option value="number">number</option>
                    <option value="string">string</option>
                    <option value="boolean">boolean</option>
                  </select>
                  <input defaultValue={column.unit} />
                  <input defaultValue={column.weight ?? 1} type="number" step="0.001" />
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

function PanelHeader({ title, detail }) {
  return (
    <div className="panel-header">
      <div>
        <h2>{title}</h2>
        <p>{detail}</p>
      </div>
    </div>
  )
}

function FilterPanel({ children }) {
  return <section className="filter-panel">{children}</section>
}

function SelectField({ label, value, onChange, children, disabled = false }) {
  return (
    <label>
      <span>{label}</span>
      <select disabled={disabled} value={value} onChange={(event) => onChange(event.target.value)}>
        {children}
      </select>
    </label>
  )
}

function InputField({ label, type, defaultValue, disabled = false }) {
  return (
    <label>
      <span>{label}</span>
      <input disabled={disabled} type={type} defaultValue={defaultValue} />
    </label>
  )
}

function DeviceTable({ rows, selectedDeviceId, onSelectDevice, onOpenDevice }) {
  return (
    <Table
      headers={['企業', '現場', 'デバイス名', 'デバイスID', '最新値', '最終受信', '通信状態', '閾値状態']}
      rows={rows.map((device) => ({
        id: device.id,
        selected: device.id === selectedDeviceId,
        onClick: onSelectDevice ? () => onSelectDevice(device.id) : undefined,
        onDoubleClick: onOpenDevice ? () => onOpenDevice(device) : undefined,
        cells: [
          getCompany(device.companyId)?.name,
          getSite(device.siteId)?.name,
          device.name,
          device.id,
          getLatestValues(device),
          device.latestReceivedAt,
          <StatusBadge key={device.id} status={device.status} />,
          device.alert,
        ],
      }))}
    />
  )
}

function TimeSeriesPanel({ column }) {
  const rawValues = getRawValues(column)
  const values = getDisplayValues(column)
  const primaryThreshold = column.thresholds[0]
  const upper = typeof primaryThreshold?.upper === 'number' ? getDisplayValue(column, primaryThreshold.upper) : primaryThreshold?.upper
  const lower = typeof primaryThreshold?.lower === 'number' ? getDisplayValue(column, primaryThreshold.lower) : primaryThreshold?.lower
  const numericValues = [upper, lower, ...values].filter((value) => typeof value === 'number')
  const minValue = Math.min(...numericValues)
  const maxValue = Math.max(...numericValues)
  const padding = Math.max((maxValue - minValue) * 0.18, 1)
  const chartMin = minValue - padding
  const chartMax = maxValue + padding
  const range = chartMax - chartMin || 1

  const toX = (index) => 40 + (index * 520) / (values.length - 1)
  const toY = (value) => 210 - ((value - chartMin) / range) * 160
  const points = values.map((value, index) => `${toX(index)},${toY(value)}`).join(' ')
  const lastValue = values.at(-1)

  return (
    <article className="panel graph-panel">
      <PanelHeader
        title={`${column.label} (${column.key})`}
        detail={`型: ${column.type} / 重み: ${column.weight ?? 1} / 表示値 = 受信値 × 重み`}
      />
      <div className="line-chart-frame">
        <svg viewBox="0 0 600 240" role="img" aria-label={`${column.label} の時系列グラフ`}>
          <g className="grid-lines">
            {[50, 90, 130, 170, 210].map((y) => (
              <line key={y} x1="40" x2="560" y1={y} y2={y} />
            ))}
          </g>
          {typeof upper === 'number' && (
            <line className="threshold-line upper" x1="40" x2="560" y1={toY(upper)} y2={toY(upper)} />
          )}
          {typeof lower === 'number' && (
            <line className="threshold-line lower" x1="40" x2="560" y1={toY(lower)} y2={toY(lower)} />
          )}
          <polyline className="series-line" points={points} />
          {values.map((value, index) => {
            const exceeded =
              (typeof upper === 'number' && value > upper) ||
              (typeof lower === 'number' && value < lower)

            return (
              <circle
                className={exceeded ? 'data-point exceeded' : 'data-point'}
                cx={toX(index)}
                cy={toY(value)}
                key={`${column.key}-${index}`}
                r={exceeded ? 5 : 3.5}
              />
            )
          })}
          <text className="axis-label" x="40" y="228">-24h</text>
          <text className="axis-label" x="520" y="228">now</text>
        </svg>
      </div>
      <div className="graph-meta">
        <span>最新値: {lastValue} {column.unit}</span>
        <span>受信生値: {rawValues.at(-1)} {column.unit}</span>
        <span>最小: {Math.min(...values)} {column.unit}</span>
        <span>最大: {Math.max(...values)} {column.unit}</span>
      </div>
    </article>
  )
}

function Table({ headers, rows, compact = false }) {
  return (
    <section className={compact ? 'table-panel compact-table' : 'table-panel'}>
      <table>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              className={[
                row.selected ? 'selected-row' : '',
                row.onDoubleClick ? 'interactive-row' : '',
              ].filter(Boolean).join(' ')}
              key={row.id ?? index}
              onClick={row.onClick}
              onDoubleClick={row.onDoubleClick}
              tabIndex={row.onDoubleClick ? 0 : undefined}
            >
              {(row.cells ?? row).map((cell, cellIndex) => (
                <td key={`${index}-${cellIndex}`}>{cell}</td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={headers.length}>該当するデータがありません</td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  )
}

function StatusBadge({ status }) {
  return <span className={`status ${status}`}>{statusLabels[status]}</span>
}

export default App
