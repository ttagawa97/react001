import { api, ApiError } from '../api'
import { roleProfiles } from '../data/constants'
import { auditLogs, companies, devices, sites, thresholds, users } from '../data/store'

const seedCompanies = companies.map((company) => ({
  ...company,
  sites: [...(company.sites ?? [])],
}))

const seedSites = sites.map((site) => ({ ...site }))

const seedDevices = devices.map((device) => ({
  ...device,
  columns: (device.columns ?? []).map((column) => ({
    ...column,
    thresholds: (column.thresholds ?? []).map((threshold) => ({ ...threshold })),
    values: [...(column.values ?? [])],
    timestamps: [...(column.timestamps ?? [])],
    serverTimestamps: [...(column.serverTimestamps ?? [])],
  })),
  latestValues: (device.latestValues ?? []).map((entry) => ({ ...entry })),
}))

const seedUsers = users.map((user) => ({ ...user }))
const seedThresholds = thresholds.map((threshold) => ({ ...threshold }))
const seedAuditLogs = auditLogs.map((log) => ({ ...log }))

export function asArray(value) {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.results)) return value.results
  if (Array.isArray(value?.items)) return value.items
  if (Array.isArray(value?.companies)) return value.companies
  if (Array.isArray(value?.sites)) return value.sites
  if (Array.isArray(value?.users)) return value.users
  if (Array.isArray(value?.devices)) return value.devices
  if (Array.isArray(value?.thresholds)) return value.thresholds
  if (Array.isArray(value?.logs)) return value.logs
  if (Array.isArray(value?.audit_logs)) return value.audit_logs
  return []
}

export function replaceCollection(target, source) {
  target.splice(0, target.length, ...source)
}

export function normalizeId(value) {
  if (value === undefined || value === null || value === '') return value
  return String(value)
}

export function toStatus(value) {
  if (value === 'active' || value === '有効') return 'active'
  if (value === 'inactive' || value === '無効' || value === '一時停止') return 'inactive'
  return value ?? 'active'
}

export function normalizeCompany(company) {
  return {
    id: normalizeId(company.id ?? company.company_id),
    name: company.name ?? company.company_name,
    status: toStatus(company.status),
    createdAt: company.createdAt ?? company.created_at ?? '-',
    updatedAt: company.updatedAt ?? company.updated_at ?? '-',
    sites: (company.sites ?? []).map(normalizeId),
  }
}

export function normalizeSite(site) {
  return {
    id: normalizeId(site.id ?? site.site_id),
    companyId: normalizeId(site.companyId ?? site.company_id ?? site.company),
    name: site.name ?? site.site_name,
    address: site.address ?? '',
    status: site.status === 'inactive' ? '無効' : site.status ?? '有効',
  }
}

function normalizeThresholdLimit(value) {
  if (value === undefined || value === null || value === '') return undefined
  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue : undefined
}

function normalizeColumnThreshold(threshold) {
  return {
    ...threshold,
    id: normalizeId(threshold.id ?? threshold.threshold_id),
    name: threshold.name ?? threshold.threshold_name ?? '閾値',
    lower: normalizeThresholdLimit(threshold.lower ?? threshold.lower_limit),
    upper: normalizeThresholdLimit(threshold.upper ?? threshold.upper_limit),
  }
}

export function normalizeColumn(column) {
  return {
    key: column.key ?? column.column_name,
    label: column.label ?? column.display_name,
    unit: column.unit ?? '',
    type: column.type ?? column.data_type ?? 'number',
    weight: Number(column.weight ?? 1),
    order: column.order ?? column.display_order ?? 1,
    thresholds: asArray(column.thresholds).map(normalizeColumnThreshold),
    values: column.values ?? [],
    timestamps: column.timestamps ?? [],
    serverTimestamps: column.serverTimestamps ?? column.server_timestamps ?? [],
  }
}

function normalizeLatestValues(value) {
  const entries = Array.isArray(value)
    ? value
    : Object.entries(value ?? {}).map(([columnName, columnValue]) => (
      typeof columnValue === 'object' && columnValue !== null
        ? { column_name: columnName, ...columnValue }
        : { column_name: columnName, value: columnValue }
    ))

  return entries.map((entry) => ({
    columnKey: entry.columnKey ?? entry.column_name ?? entry.key,
    displayName: entry.displayName ?? entry.display_name,
    unit: entry.unit ?? '',
    rawValue: entry.rawValue ?? entry.raw_value ?? entry.value,
    displayValue: entry.displayValue ?? entry.display_value,
  })).filter((entry) => entry.columnKey)
}

function normalizeAlertStatus(value) {
  if (value === 'normal') return '正常'
  return value ?? '正常'
}

function normalizePositiveNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? number : null
}

function estimateReceiveIntervalSeconds(columns) {
  const receivedTimes = columns
    .flatMap((column) => (
      column.serverTimestamps?.length > 0 ? column.serverTimestamps : column.timestamps ?? []
    ))
    .map((timestamp) => new Date(timestamp).getTime())
    .filter(Number.isFinite)
    .filter((timestamp, index, timestamps) => timestamps.indexOf(timestamp) === index)
    .sort((left, right) => left - right)
    .slice(-10)

  if (receivedTimes.length < 2) return null

  const intervals = receivedTimes.slice(1).map((timestamp, index) => (
    (timestamp - receivedTimes[index]) / 1000
  )).filter((interval) => interval > 0)
  if (intervals.length === 0) return null

  return intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length
}

function normalizeCommunicationStatus(value) {
  const status = String(value ?? '').trim().toLowerCase()
  if (['online', 'active', 'running', '稼働', '正常'].includes(status)) return 'online'
  if (['warning', 'warn', '警告'].includes(status)) return 'warning'
  if (['offline', 'inactive', 'stopped', 'disconnected', '停止', '切断', '通信断'].includes(status)) return 'offline'
  return 'unknown'
}

function getCommunicationStatus(status, latestReceivedAt, estimatedIntervalSeconds) {
  if (!latestReceivedAt || latestReceivedAt === '-') return 'unknown'
  if (!estimatedIntervalSeconds) return normalizeCommunicationStatus(status)

  const normalizedReceivedAt = typeof latestReceivedAt === 'string'
    ? latestReceivedAt.replace(' ', 'T')
    : latestReceivedAt
  const lastReceivedTime = new Date(normalizedReceivedAt).getTime()
  if (!Number.isFinite(lastReceivedTime)) return normalizeCommunicationStatus(status)

  const elapsedSeconds = (Date.now() - lastReceivedTime) / 1000
  return elapsedSeconds > estimatedIntervalSeconds ? 'offline' : 'online'
}

function enrichDeviceStatusFromKnownHistory(device) {
  if (device.estimatedIntervalSeconds) return device

  const seedDevice = seedDevices.find((candidate) => candidate.id === device.id)
  const estimatedIntervalSeconds = estimateReceiveIntervalSeconds(seedDevice?.columns ?? [])
  if (!estimatedIntervalSeconds) return device

  return {
    ...device,
    estimatedIntervalSeconds,
    status: getCommunicationStatus(device.status, device.latestReceivedAt, estimatedIntervalSeconds),
  }
}

function findCompanyIdByName(companyName) {
  return companies.find((company) => company.name === companyName)?.id
}

function findSiteIdByName(siteName, companyId) {
  return sites.find((site) => (
    site.name === siteName &&
    (!companyId || site.companyId === companyId)
  ))?.id
}

export function normalizeDevice(device) {
  const columns = asArray(device.columns ?? device.device_columns).map(normalizeColumn)
  const apiId = normalizeId(device.apiId ?? device.id)
  const companyId = normalizeId(device.companyId ?? device.company_id ?? device.company) ?? findCompanyIdByName(device.company_name)
  const siteId = normalizeId(device.siteId ?? device.site_id ?? device.site) ?? findSiteIdByName(device.site_name, companyId)
  const latestReceivedAt = device.latestReceivedAt ?? device.latest_received_at ?? '-'
  const estimatedIntervalSeconds = normalizePositiveNumber(
    device.estimatedIntervalSeconds ?? device.estimated_interval_seconds,
  ) ?? estimateReceiveIntervalSeconds(columns)

  return {
    id: normalizeId(device.deviceId ?? device.device_id ?? device.id),
    apiId,
    name: device.name ?? device.device_name,
    companyId,
    siteId,
    status: getCommunicationStatus(
      device.status ?? device.communication_status,
      latestReceivedAt,
      estimatedIntervalSeconds,
    ),
    authId: device.authId ?? device.auth_id ?? '',
    inputType: device.inputType ?? device.input_type ?? 'json',
    csvHeaderMode: device.csvHeaderMode ?? device.csv_header_mode ?? '-',
    latestReceivedAt,
    estimatedIntervalSeconds,
    alert: normalizeAlertStatus(device.alert ?? device.alert_status),
    columns,
    latestValues: normalizeLatestValues(device.latestValues ?? device.latest_values),
  }
}

function findDeviceIdByApiId(deviceApiId, sourceDevices = devices) {
  const normalizedDeviceApiId = normalizeId(deviceApiId)
  return sourceDevices.find((device) => device.apiId === normalizedDeviceApiId)?.id
}

function mergeLatestDeviceData(sourceDevices, latestDevices) {
  const latestById = new Map(latestDevices.map((device) => [device.id, device]))

  return sourceDevices.map((device) => {
    const latest = latestById.get(device.id)
    if (!latest) return device

    const estimatedIntervalSeconds = latest.estimatedIntervalSeconds ?? device.estimatedIntervalSeconds
    const latestReceivedAt = latest.latestReceivedAt === '-' ? device.latestReceivedAt : latest.latestReceivedAt

    return {
      ...device,
      status: getCommunicationStatus(latest.status, latestReceivedAt, estimatedIntervalSeconds),
      latestReceivedAt,
      estimatedIntervalSeconds,
      alert: latest.alert,
      latestValues: latest.latestValues,
    }
  })
}

export function normalizeUser(user) {
  return {
    id: normalizeId(user.id ?? user.user_id),
    loginId: user.loginId ?? user.login_id,
    userName: user.userName ?? user.user_name,
    roleId: user.roleId ?? user.role,
    companyId: normalizeId(user.companyId ?? user.company_id ?? user.company) ?? null,
    siteId: normalizeId(user.siteId ?? user.site_id ?? user.site) ?? null,
    scope: user.scope ?? '',
    status: user.status === 'inactive' ? '一時停止' : user.status ?? '有効',
  }
}

function getAuditUserLoginId(log) {
  const source = log.changed_by ?? log.user ?? log.user_id
  if (source && typeof source === 'object') {
    return source.login_id ?? source.loginId ?? source.username ?? source.id
  }

  const directLoginId = log.login_id ?? log.loginId ?? log.username
  if (directLoginId) return directLoginId

  const normalizedUserId = normalizeId(source)
  return users.find((user) => user.id === normalizedUserId)?.loginId ?? normalizedUserId
}

function normalizeAuditTargetType(value, action) {
  const type = String(value ?? '').toLowerCase()
  if (type.includes('company')) return 'company'
  if (type.includes('site')) return 'site'
  if (type.includes('device')) return 'device'
  if (type.includes('user')) return 'user'
  if (type.includes('threshold')) return 'threshold'
  if (action?.startsWith('company_')) return 'company'
  if (action?.startsWith('site_')) return 'site'
  if (action?.startsWith('device_')) return 'device'
  if (action?.startsWith('user_')) return 'user'
  if (action?.startsWith('threshold_')) return 'threshold'
  return type
}

function getAuditTargetId(log) {
  const source = log.target_id ?? log.targetId ?? log.target
  if (source && typeof source === 'object') {
    return normalizeId(source.id ?? source.device_id ?? source.login_id)
  }
  return normalizeId(source)
}

function getAuditTargetLabel(log, targetType, targetId) {
  const typedName = {
    company: log.company_name,
    site: log.site_name,
    device: log.device_name,
    user: log.user_name,
    threshold: log.threshold_name,
  }[targetType]
  const directName = log.target_name ?? log.targetName ?? typedName
  if (directName) return directName
  if (!targetId) return '-'

  if (targetType === 'company') {
    return companies.find((company) => company.id === targetId)?.name ?? targetId
  }
  if (targetType === 'site') {
    return sites.find((site) => site.id === targetId)?.name ?? targetId
  }
  if (targetType === 'device') {
    return devices.find((device) => device.id === targetId || device.apiId === targetId)?.name ?? targetId
  }
  if (targetType === 'user') {
    const user = users.find((candidate) => candidate.id === targetId || candidate.loginId === targetId)
    return user?.userName ?? targetId
  }
  if (targetType === 'threshold') {
    const [deviceId, columnName] = String(targetId).split(/\s*\/\s*/, 2)
    const device = devices.find((candidate) => candidate.id === deviceId || candidate.apiId === deviceId)
    return device ? `${device.name}${columnName ? ` / ${columnName}` : ''}` : targetId
  }

  return targetId
}

function getRelationId(value) {
  if (value && typeof value === 'object') {
    return normalizeId(value.id ?? value.company_id ?? value.site_id)
  }
  return normalizeId(value)
}

export function normalizeAuditLog(log) {
  const action = log.action ?? log.event ?? log.operation
  const targetType = normalizeAuditTargetType(log.target_type ?? log.targetType, action)
  const targetId = getAuditTargetId(log)

  return {
    at: log.at ?? log.changed_at ?? log.created_at ?? log.occurred_at,
    user: getAuditUserLoginId(log) ?? '-',
    companyId: getRelationId(log.companyId ?? log.company_id ?? log.company),
    siteId: getRelationId(log.siteId ?? log.site_id ?? log.site),
    action: action ?? '-',
    targetType,
    targetId,
    target: getAuditTargetLabel(log, targetType, targetId),
  }
}

export function normalizeThreshold(threshold, sourceDevices = devices) {
  const deviceApiId = normalizeId(threshold.deviceApiId ?? threshold.device)

  return {
    id: normalizeId(threshold.id ?? threshold.threshold_id),
    companyId: normalizeId(threshold.companyId ?? threshold.company_id ?? threshold.company),
    siteId: normalizeId(threshold.siteId ?? threshold.site_id ?? threshold.site),
    deviceId: normalizeId(threshold.deviceId ?? threshold.device_id)
      ?? findDeviceIdByApiId(deviceApiId, sourceDevices)
      ?? deviceApiId,
    deviceApiId,
    columnKey: threshold.columnKey ?? threshold.column_name,
    name: threshold.name ?? threshold.threshold_name,
    lower: normalizeThresholdLimit(threshold.lower ?? threshold.lower_limit),
    upper: normalizeThresholdLimit(threshold.upper ?? threshold.upper_limit),
    notificationEmails: threshold.notificationEmails ?? threshold.notification_emails ?? '',
    suppress: threshold.suppress ?? threshold.suppress_minutes,
  }
}

function attachThresholdsToDevices(sourceDevices, sourceThresholds) {
  return sourceDevices.map((device) => ({
    ...device,
    columns: device.columns.map((column) => {
      const matchingThresholds = sourceThresholds.filter((threshold) => (
        (
          threshold.deviceId === device.id ||
          threshold.deviceId === device.apiId ||
          threshold.deviceApiId === device.id ||
          threshold.deviceApiId === device.apiId
        ) &&
        threshold.columnKey === column.key
      ))
      if (matchingThresholds.length === 0) return column

      const thresholdById = new Map(column.thresholds.map((threshold) => [threshold.id, threshold]))
      matchingThresholds.forEach((threshold) => thresholdById.set(threshold.id, threshold))
      return { ...column, thresholds: [...thresholdById.values()] }
    }),
  }))
}

export function applyThresholdData(device, thresholdData) {
  if (!device) return device
  const normalizedThresholds = asArray(thresholdData).map((threshold) => normalizeThreshold(threshold, [device]))
  return attachThresholdsToDevices([device], normalizedThresholds)[0]
}

async function optionalData(request, fallback = []) {
  try {
    return await request()
  } catch {
    return fallback
  }
}

function fallbackWhenEmpty(data, fallback) {
  return asArray(data).length > 0 ? data : fallback
}

export async function loadInitialData(role = 'system_admin') {
  const canReadCompanies = role === 'system_admin'
  const canReadManagementTables = role !== 'general_user'

  const [companyData, siteData, deviceData, latestDeviceData, userData, thresholdData, auditLogData] = await Promise.all([
    canReadCompanies
      ? optionalData(api.listCompanies).then((data) => (
        asArray(data).length > 0
          ? data
          : optionalData(api.listMasterCompanies, seedCompanies)
      ))
      : optionalData(api.listMasterCompanies, seedCompanies),
    optionalData(api.listSites, seedSites),
    optionalData(api.listDevices, seedDevices),
    optionalData(api.listLatestDevices, []),
    canReadManagementTables ? optionalData(api.listUsers, seedUsers) : Promise.resolve(seedUsers),
    optionalData(api.listThresholds, seedThresholds),
    canReadManagementTables ? optionalData(api.listAuditLogs, seedAuditLogs) : Promise.resolve(seedAuditLogs),
  ])

  replaceCollection(companies, asArray(fallbackWhenEmpty(companyData, seedCompanies)).map(normalizeCompany))
  replaceCollection(sites, asArray(fallbackWhenEmpty(siteData, seedSites)).map(normalizeSite))

  const normalizedDevices = asArray(fallbackWhenEmpty(deviceData, seedDevices))
    .map(normalizeDevice)
    .map(enrichDeviceStatusFromKnownHistory)
  const normalizedLatestDevices = asArray(latestDeviceData).map(normalizeDevice)
  const normalizedThresholds = asArray(fallbackWhenEmpty(thresholdData, seedThresholds))
    .map((threshold) => normalizeThreshold(threshold, normalizedDevices))

  replaceCollection(devices, attachThresholdsToDevices(
    mergeLatestDeviceData(normalizedDevices, normalizedLatestDevices),
    normalizedThresholds,
  ))
  replaceCollection(users, asArray(fallbackWhenEmpty(userData, seedUsers)).map(normalizeUser))
  replaceCollection(thresholds, normalizedThresholds)
  replaceCollection(auditLogs, asArray(fallbackWhenEmpty(auditLogData, seedAuditLogs)).map(normalizeAuditLog))
}

export async function refreshLatestDevices(params) {
  const latestDeviceData = await api.listLatestDevices(params)
  const normalizedLatestDevices = asArray(latestDeviceData).map(normalizeDevice)
  replaceCollection(devices, mergeLatestDeviceData(devices, normalizedLatestDevices))
}

export function formatApiError(error) {
  if (error instanceof ApiError) return error.message
  return error?.message ?? 'API通信に失敗しました'
}

export function getCompany(companyId) {
  const normalizedCompanyId = normalizeId(companyId)
  return companies.find((company) => company.id === normalizedCompanyId)
}

export function getSite(siteId) {
  const normalizedSiteId = normalizeId(siteId)
  return sites.find((site) => site.id === normalizedSiteId)
}

export function getDevice(deviceId) {
  const normalizedDeviceId = normalizeId(deviceId)
  return devices.find((device) => device.id === normalizedDeviceId)
}

export function getScopeDefaults(role) {
  const profile = roleProfiles[role]
  return {
    companyId: profile.companyId ?? 'all',
    siteId: profile.siteId ?? 'all',
  }
}

export function normalizeFilter(role, nextFilter) {
  const profile = roleProfiles[role]
  let companyId = profile.companyId ?? nextFilter.companyId ?? 'all'
  let siteId = profile.siteId ?? nextFilter.siteId ?? 'all'

  if (siteId !== 'all') {
    const site = getSite(siteId)
    if (!site) {
      siteId = 'all'
    } else if (companyId === 'all') {
      companyId = site.companyId
    } else if (site.companyId !== companyId) {
      siteId = 'all'
    }
  }

  return { companyId, siteId }
}

export function matchesFilter(item, filter) {
  const itemCompanyId = normalizeId(item.companyId)
  const itemSiteId = normalizeId(item.siteId)
  const filterCompanyId = normalizeId(filter.companyId)
  const filterSiteId = normalizeId(filter.siteId)

  return (
    (filter.companyId === 'all' || itemCompanyId === filterCompanyId) &&
    (filter.siteId === 'all' || itemSiteId === filterSiteId)
  )
}

export function getDisplayValue(column, rawValue) {
  if (column.type !== 'number' || typeof rawValue !== 'number') return rawValue
  const weightedValue = rawValue * (column.weight ?? 1)
  return Number.isInteger(weightedValue) ? weightedValue : Number(weightedValue.toFixed(3))
}

export function getLatestValues(device) {
  if (device.latestValues?.length > 0) {
    return device.latestValues.map((latestValue) => {
      const column = device.columns.find((item) => item.key === latestValue.columnKey)
      const numericRawValue = column?.type === 'number' && latestValue.rawValue !== ''
        ? Number(latestValue.rawValue)
        : latestValue.rawValue
      const normalizedRawValue = Number.isNaN(numericRawValue) ? latestValue.rawValue : numericRawValue
      const value = latestValue.displayValue ?? getDisplayValue(column ?? {}, normalizedRawValue)
      if (value === undefined || value === null) return null
      const label = column?.label ?? latestValue.displayName ?? latestValue.columnKey
      const unit = column?.unit ?? latestValue.unit
      return `${label} ${value}${unit ? ` ${unit}` : ''}`
    }).filter(Boolean).join(' / ') || '-'
  }

  const latestValues = device.columns
    .map((column) => {
      const latest = getDisplayValue(column, column.values.at(-1))
      if (latest === undefined || latest === null) return null
      return `${column.label} ${latest}${column.unit ? ` ${column.unit}` : ''}`
    })
    .filter(Boolean)
    .join(' / ')

  return latestValues || '-'
}

export function getRawValues(column) {
  return column.values
}

export function getDisplayValues(column) {
  return column.values.map((value) => getDisplayValue(column, value))
}

export function getThresholdStatus(columns, latestValues = [], preferLatestValues = false) {
  let hasThreshold = false
  let hasComparableValue = false
  let hasUpperExceeded = false
  let hasLowerExceeded = false

  columns.forEach((column) => {
    if (column.thresholds.length === 0 || column.type !== 'number') return
    hasThreshold = true

    const latestEntry = latestValues.find((entry) => entry.columnKey === column.key)
    const latestColumnValue = getDisplayValue(column, column.values.at(-1))
    const numericRawValue = column.type === 'number' ? Number(latestEntry?.rawValue) : latestEntry?.rawValue
    const latestApiValue = latestEntry?.displayValue
      ?? getDisplayValue(column, Number.isNaN(numericRawValue) ? latestEntry?.rawValue : numericRawValue)
    const latestValue = preferLatestValues
      ? latestApiValue ?? latestColumnValue
      : latestColumnValue ?? latestApiValue
    const numericValue = Number(latestValue)
    if (!Number.isFinite(numericValue)) return
    hasComparableValue = true

    column.thresholds.forEach((threshold) => {
      if (typeof threshold.upper === 'number' && numericValue > threshold.upper) hasUpperExceeded = true
      if (typeof threshold.lower === 'number' && numericValue < threshold.lower) hasLowerExceeded = true
    })
  })

  if (hasUpperExceeded && hasLowerExceeded) return '上下限超過'
  if (hasUpperExceeded) return '上限超過'
  if (hasLowerExceeded) return '下限超過'
  if (hasThreshold && !hasComparableValue) return '判定不能'
  return hasThreshold ? '正常' : '閾値未設定'
}

function getGraphPointColumnKey(point) {
  return point.column_name ?? point.columnName ?? point.key
}

function getGraphPointRawValue(point, column) {
  const rawValue = point.raw_value ?? point.rawValue ?? point.value_number ?? point.value
  if (rawValue !== undefined && rawValue !== null && rawValue !== '') return rawValue

  const displayValue = point.display_value ?? point.displayValue
  if (displayValue === undefined || displayValue === null || displayValue === '') return undefined
  if (column?.type === 'number' && Number(column.weight ?? 1) !== 0) {
    return Number(displayValue) / Number(column.weight ?? 1)
  }
  return displayValue
}

function normalizeGraphValue(value, column) {
  if (column?.type === 'number') {
    const numericValue = Number(value)
    return Number.isFinite(numericValue) ? numericValue : undefined
  }
  return value
}

export function applyGraphData(device, graphData) {
  const responsePoints = asArray(graphData?.points ?? graphData)
  const pointsByColumn = new Map()

  responsePoints.forEach((entry) => {
    const nestedPoints = asArray(entry?.points)
    if (nestedPoints.length > 0) {
      const entryColumnKey = getGraphPointColumnKey(entry)
      nestedPoints.forEach((point) => {
        const columnKey = getGraphPointColumnKey(point) ?? entryColumnKey
        if (!columnKey || point.is_valid === false || point.isValid === false) return
        const current = pointsByColumn.get(columnKey) ?? []
        current.push(point)
        pointsByColumn.set(columnKey, current)
      })
      return
    }

    const columnKey = getGraphPointColumnKey(entry)
    if (!columnKey || entry.is_valid === false || entry.isValid === false) return
    const current = pointsByColumn.get(columnKey) ?? []
    current.push(entry)
    pointsByColumn.set(columnKey, current)
  })

  const knownColumns = new Map(device.columns.map((column) => [column.key, column]))
  const columnKeys = new Set([...knownColumns.keys(), ...pointsByColumn.keys()])

  return [...columnKeys].map((columnKey, index) => {
    const column = knownColumns.get(columnKey) ?? normalizeColumn({
      column_name: columnKey,
      display_name: columnKey,
      display_order: index + 1,
    })
    const normalizedPoints = (pointsByColumn.get(columnKey) ?? [])
      .map((point) => ({
        value: normalizeGraphValue(getGraphPointRawValue(point, column), column),
        timestamp: point.device_timestamp ?? point.deviceTimestamp ?? point.timestamp,
        serverTimestamp: point.server_timestamp
          ?? point.serverTimestamp
          ?? point.received_at
          ?? point.receivedAt,
      }))
      .filter((point) => point.value !== undefined)
      .sort((left, right) => {
        const leftTime = new Date(left.serverTimestamp ?? left.timestamp).getTime()
        const rightTime = new Date(right.serverTimestamp ?? right.timestamp).getTime()
        if (!Number.isFinite(leftTime) || !Number.isFinite(rightTime)) return 0
        return leftTime - rightTime
      })

    return {
      ...column,
      values: normalizedPoints.map((point) => point.value),
      timestamps: normalizedPoints.map((point) => point.timestamp),
      serverTimestamps: normalizedPoints.map((point) => point.serverTimestamp),
    }
  }).sort((left, right) => left.order - right.order)
}

export function getThresholdRows(sourceDevices = devices) {
  if (thresholds.length > 0) {
    return thresholds
      .filter((threshold) => sourceDevices.some((device) => device.id === threshold.deviceId))
      .map((threshold) => {
        const device = getDevice(threshold.deviceId)
        const column = device?.columns.find((item) => item.key === threshold.columnKey)
        return {
          id: threshold.id,
          companyId: threshold.companyId,
          siteId: threshold.siteId,
          deviceId: threshold.deviceId,
          columnKey: threshold.columnKey,
          cells: [
            getCompany(threshold.companyId)?.name,
            getSite(threshold.siteId)?.name,
            device?.name,
            column ? `${column.label} (${column.key})` : threshold.columnKey,
            threshold.name,
            threshold.lower ?? '-',
            threshold.upper ?? '-',
            threshold.notificationEmails || '-',
            `${threshold.suppress}分`,
          ],
        }
      })
  }

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
