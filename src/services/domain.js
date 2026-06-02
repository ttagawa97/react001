import { api, ApiError } from '../api'
import { roleProfiles } from '../data/constants'
import { auditLogs, companies, devices, sites, thresholds, users } from '../data/store'

export function asArray(value) {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.items)) return value.items
  if (Array.isArray(value?.companies)) return value.companies
  if (Array.isArray(value?.sites)) return value.sites
  if (Array.isArray(value?.users)) return value.users
  if (Array.isArray(value?.devices)) return value.devices
  if (Array.isArray(value?.thresholds)) return value.thresholds
  if (Array.isArray(value?.logs)) return value.logs
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

export function normalizeColumn(column) {
  return {
    key: column.key ?? column.column_name,
    label: column.label ?? column.display_name,
    unit: column.unit ?? '',
    type: column.type ?? column.data_type ?? 'number',
    weight: Number(column.weight ?? 1),
    order: column.order ?? column.display_order ?? 1,
    thresholds: column.thresholds ?? [],
    values: column.values ?? [],
  }
}

function normalizeAlertStatus(value) {
  if (value === 'normal') return '正常'
  return value ?? '正常'
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

  return {
    id: normalizeId(device.deviceId ?? device.device_id ?? device.id),
    apiId,
    name: device.name ?? device.device_name,
    companyId,
    siteId,
    status: device.status ?? device.communication_status ?? 'offline',
    authId: device.authId ?? device.auth_id ?? '',
    inputType: device.inputType ?? device.input_type ?? 'json',
    csvHeaderMode: device.csvHeaderMode ?? device.csv_header_mode ?? '-',
    latestReceivedAt: device.latestReceivedAt ?? device.latest_received_at ?? '-',
    alert: normalizeAlertStatus(device.alert ?? device.alert_status),
    columns,
  }
}

function findDeviceIdByApiId(deviceApiId) {
  const normalizedDeviceApiId = normalizeId(deviceApiId)
  return devices.find((device) => device.apiId === normalizedDeviceApiId)?.id
}

function mergeLatestDeviceData(sourceDevices, latestDevices) {
  const latestById = new Map(latestDevices.map((device) => [device.id, device]))

  return sourceDevices.map((device) => {
    const latest = latestById.get(device.id)
    if (!latest) return device

    return {
      ...device,
      status: latest.status,
      latestReceivedAt: latest.latestReceivedAt,
      alert: latest.alert,
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

export function normalizeAuditLog(log) {
  return {
    at: log.at ?? log.created_at ?? log.occurred_at,
    user: log.user ?? log.login_id ?? log.user_name,
    companyId: normalizeId(log.companyId ?? log.company_id ?? log.company),
    siteId: normalizeId(log.siteId ?? log.site_id ?? log.site),
    action: log.action,
    target: log.target,
  }
}

export function normalizeThreshold(threshold) {
  const deviceApiId = normalizeId(threshold.deviceApiId ?? threshold.device)

  return {
    id: normalizeId(threshold.id ?? threshold.threshold_id),
    companyId: normalizeId(threshold.companyId ?? threshold.company_id ?? threshold.company),
    siteId: normalizeId(threshold.siteId ?? threshold.site_id ?? threshold.site),
    deviceId: normalizeId(threshold.deviceId ?? threshold.device_id) ?? findDeviceIdByApiId(deviceApiId) ?? deviceApiId,
    deviceApiId,
    columnKey: threshold.columnKey ?? threshold.column_name,
    name: threshold.name ?? threshold.threshold_name,
    lower: threshold.lower ?? threshold.lower_limit,
    upper: threshold.upper ?? threshold.upper_limit,
    notificationEmails: threshold.notificationEmails ?? threshold.notification_emails ?? '',
    suppress: threshold.suppress ?? threshold.suppress_minutes,
  }
}

export async function loadInitialData() {
  const [companyData, siteData, deviceData, latestDeviceData, userData, thresholdData, auditLogData] = await Promise.all([
    api.listCompanies(),
    api.listSites(),
    api.listDevices(),
    api.listLatestDevices(),
    api.listUsers(),
    api.listThresholds(),
    api.listAuditLogs(),
  ])

  replaceCollection(companies, asArray(companyData).map(normalizeCompany))
  replaceCollection(sites, asArray(siteData).map(normalizeSite))

  const normalizedDevices = asArray(deviceData).map(normalizeDevice)
  const normalizedLatestDevices = asArray(latestDeviceData).map(normalizeDevice)

  replaceCollection(devices, mergeLatestDeviceData(normalizedDevices, normalizedLatestDevices))
  replaceCollection(users, asArray(userData).map(normalizeUser))
  replaceCollection(thresholds, asArray(thresholdData).map(normalizeThreshold))
  replaceCollection(auditLogs, asArray(auditLogData).map(normalizeAuditLog))
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
    deviceId: 'all',
  }
}

export function normalizeFilter(role, nextFilter) {
  const profile = roleProfiles[role]
  const companyId = profile.companyId ?? nextFilter.companyId ?? 'all'
  const siteId = profile.siteId ?? nextFilter.siteId ?? 'all'
  let deviceId = nextFilter.deviceId ?? 'all'

  if (deviceId !== 'all') {
    const device = getDevice(deviceId)
    const invalidCompany = companyId !== 'all' && device?.companyId !== normalizeId(companyId)
    const invalidSite = siteId !== 'all' && device?.siteId !== normalizeId(siteId)
    if (!device || invalidCompany || invalidSite) deviceId = 'all'
  }

  return { companyId, siteId, deviceId }
}

export function matchesFilter(item, filter) {
  const itemCompanyId = normalizeId(item.companyId)
  const itemSiteId = normalizeId(item.siteId)
  const itemDeviceId = normalizeId(item.deviceId ?? item.id)
  const filterCompanyId = normalizeId(filter.companyId)
  const filterSiteId = normalizeId(filter.siteId)
  const filterDeviceId = normalizeId(filter.deviceId)

  return (
    (filter.companyId === 'all' || itemCompanyId === filterCompanyId) &&
    (filter.siteId === 'all' || itemSiteId === filterSiteId) &&
    (filter.deviceId === 'all' || itemDeviceId === filterDeviceId)
  )
}

export function getDisplayValue(column, rawValue) {
  if (column.type !== 'number' || typeof rawValue !== 'number') return rawValue
  const weightedValue = rawValue * (column.weight ?? 1)
  return Number.isInteger(weightedValue) ? weightedValue : Number(weightedValue.toFixed(3))
}

export function getLatestValues(device) {
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
