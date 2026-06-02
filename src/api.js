const API_BASE_PATH = import.meta.env.VITE_API_BASE_PATH ?? '/api/v1'

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

function buildUrl(path, params) {
  const url = new URL(`${API_BASE_PATH}${path}`, window.location.origin)
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '' && value !== 'all') {
      url.searchParams.set(key, value)
    }
  })
  return url
}

async function request(path, { method = 'GET', body, params } = {}) {
  const response = await fetch(buildUrl(path, params), {
    method,
    headers: {
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  })

  const contentType = response.headers.get('content-type') ?? ''
  const payload = contentType.includes('application/json') ? await response.json() : null

  if (!response.ok || payload?.success === false) {
    throw new ApiError(
      payload?.error?.message ?? `API request failed: ${method} ${path}`,
      response.status,
      payload?.error?.details,
    )
  }

  return payload?.data ?? payload
}

export const api = {
  login: (body) => request('/auth/login', { method: 'POST', body }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  requestPasswordReset: (body) => request('/auth/password-reset/request', { method: 'POST', body }),
  executePasswordReset: (body) => request('/auth/password-reset/execute', { method: 'POST', body }),

  listCompanies: () => request('/companies'),
  createCompany: (body) => request('/companies', { method: 'POST', body }),
  updateCompany: (companyId, body) => request(`/companies/${encodeURIComponent(companyId)}`, { method: 'PUT', body }),
  disableCompany: (companyId) => request(`/companies/${encodeURIComponent(companyId)}/disable`, { method: 'POST' }),

  listSites: (params) => request('/sites', { params }),
  createSite: (body) => request('/sites', { method: 'POST', body }),

  listUsers: (params) => request('/users', { params }),
  createUser: (body) => request('/users', { method: 'POST', body }),
  updateUser: (userId, body) => request(`/users/${encodeURIComponent(userId)}`, { method: 'PUT', body }),
  resetUserPassword: (userId) => request(`/users/${encodeURIComponent(userId)}/reset-password`, { method: 'POST' }),

  listDevices: (params) => request('/devices/latest', { params }),
  createDevice: (body) => request('/devices', { method: 'POST', body }),
  updateDevice: (deviceId, body) => request(`/devices/${encodeURIComponent(deviceId)}`, { method: 'PUT', body }),
  getDeviceGraph: (deviceId, params) => request(`/devices/${encodeURIComponent(deviceId)}/graph`, { params }),

  listThresholds: (params) => request('/thresholds', { params }),
  createThreshold: (body) => request('/thresholds', { method: 'POST', body }),

  getDashboardSummary: (params) => request('/dashboard/summary', { params }),
  listAuditLogs: (params) => request('/audit-logs', { params }),
}
