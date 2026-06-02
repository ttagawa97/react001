export const menuItems = [
  { id: 'dashboard', label: 'ダッシュボード', icon: 'grid' },
  { id: 'devices', label: 'デバイス一覧', icon: 'device' },
  { id: 'company_settings', label: '企業設定', icon: 'company' },
  { id: 'site_settings', label: '現場設定', icon: 'site' },
  { id: 'user_settings', label: 'ユーザー設定', icon: 'user' },
  { id: 'device_settings', label: 'デバイス設定', icon: 'tune' },
  { id: 'threshold_settings', label: '閾値設定', icon: 'alert' },
  { id: 'audit_logs', label: '監査ログ', icon: 'log' },
]

export const roleLabels = {
  system_admin: 'システム管理者',
  company_admin: '企業管理者',
  site_admin: '現場管理者',
  general_user: '一般ユーザー',
}

export const assignableRoles = {
  system_admin: ['system_admin', 'company_admin', 'site_admin', 'general_user'],
  company_admin: ['company_admin', 'site_admin', 'general_user'],
  site_admin: ['site_admin', 'general_user'],
}

export const roleProfiles = {
  system_admin: { loginId: 'sys-admin', companyId: null, siteId: null },
  company_admin: { loginId: 'minato-admin', companyId: 'co-minato', siteId: null },
  site_admin: { loginId: 'cold-lead', companyId: 'co-minato', siteId: 'st-cold' },
  general_user: { loginId: 'cold-viewer', companyId: 'co-minato', siteId: 'st-cold' },
}

export const menuVisibility = {
  system_admin: menuItems.map((item) => item.id),
  company_admin: ['dashboard', 'devices', 'site_settings', 'user_settings', 'device_settings', 'threshold_settings', 'audit_logs'],
  site_admin: ['dashboard', 'devices', 'user_settings', 'device_settings', 'threshold_settings', 'audit_logs'],
  general_user: ['dashboard', 'devices'],
}

export const statusLabels = {
  online: '稼働',
  warning: '警告',
  offline: '切断',
}

export const graphPoints = [38, 45, 42, 58, 61, 54, 68, 64, 71, 76, 73, 82]
