const API_BASE_PATH = import.meta.env.VITE_API_BASE_PATH ?? '/api/v1'
const AUTH_TOKEN_STORAGE_KEY = 'iot_platform_auth_token'

let authToken = sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY)

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
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
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

async function download(path, { params } = {}) {
  const response = await fetch(buildUrl(path, params), {
    method: 'GET',
    headers: {
      Accept: 'text/csv',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    credentials: 'include',
  })

  if (!response.ok) {
    const contentType = response.headers.get('content-type') ?? ''
    const payload = contentType.includes('application/json') ? await response.json() : null
    throw new ApiError(
      payload?.error?.message ?? `API request failed: GET ${path}`,
      response.status,
      payload?.error?.details,
    )
  }

  return {
    blob: await response.blob(),
    contentDisposition: response.headers.get('content-disposition'),
  }
}

function setAuthToken(token) {
  authToken = token ?? ''
  if (authToken) {
    sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, authToken)
  } else {
    sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
  }
}

export const api = {
  getAuthToken: () => authToken,
  clearAuthToken: () => setAuthToken(''),
  login: async (body) => {
    const result = await request('/auth/login', { method: 'POST', body })
    setAuthToken(result?.token)
    return result
  },
  logout: async () => {
    try {
      return await request('/auth/logout', { method: 'POST' })
    } finally {
      setAuthToken('')
    }
  },
  requestPasswordReset: (body) => request('/auth/password-reset/request', { method: 'POST', body }),
  executePasswordReset: (body) => request('/auth/password-reset/execute', { method: 'POST', body }),

  listCompanies: () => request('/companies'),
  listMasterCompanies: () => request('/masters/companies'),
  listMasterSites: () => request('/masters/sites'),
  listMasterDevices: () => request('/masters/devices'),
  createCompany: (body) => request('/companies', { method: 'POST', body }),
  updateCompany: (companyId, body) => request(`/companies/${encodeURIComponent(companyId)}`, { method: 'PUT', body }),
  disableCompany: (companyId) => request(`/companies/${encodeURIComponent(companyId)}/disable`, { method: 'POST' }),

  listSites: (params) => request('/sites', { params }),
  createSite: (body) => request('/sites', { method: 'POST', body }),

  listUsers: (params) => request('/users', { params }),
  createUser: (body) => request('/users', { method: 'POST', body }),
  updateUser: (userId, body) => request(`/users/${encodeURIComponent(userId)}`, { method: 'PUT', body }),
  resetUserPassword: (userId) => request(`/users/${encodeURIComponent(userId)}/reset-password`, { method: 'POST' }),

  listDevices: (params) => request('/devices', { params }),
  listLatestDevices: (params) => request('/devices/latest', { params }),
  createDevice: (body) => request('/devices', { method: 'POST', body }),
  updateDevice: (deviceId, body) => request(`/devices/${encodeURIComponent(deviceId)}`, { method: 'PUT', body }),
  getDeviceGraph: (deviceId, params) => request(`/devices/${encodeURIComponent(deviceId)}/graph`, { params }),
  downloadDeviceGraphCsv: (deviceId, params) => download(`/devices/${encodeURIComponent(deviceId)}/graph/csv`, { params }),

  listThresholds: (params) => request('/thresholds', { params }),
  createThreshold: (body) => request('/thresholds', { method: 'POST', body }),

  getDashboardSummary: (params) => request('/dashboard/summary', { params }),
  listAuditLogs: (params) => request('/audit-logs', { params }),
}
