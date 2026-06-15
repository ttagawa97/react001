export const menuItems = [
  { id: 'dashboard', label: 'ダッシュボード', icon: 'grid', group: 'main' },
  { id: 'devices', label: 'デバイス一覧', icon: 'device', group: 'main' },
  { id: 'company_settings', label: '企業設定', icon: 'company', group: 'maintenance' },
  { id: 'site_settings', label: '現場設定', icon: 'site', group: 'maintenance' },
  { id: 'user_settings', label: 'ユーザー設定', icon: 'user', group: 'maintenance' },
  { id: 'device_settings', label: 'デバイス設定', icon: 'tune', group: 'maintenance' },
  { id: 'threshold_settings', label: '閾値設定', icon: 'alert', group: 'maintenance' },
  { id: 'audit_logs', label: '監査ログ', icon: 'log', group: 'maintenance' },
]

export const menuGroups = [
  { id: 'main', label: '' },
  { id: 'maintenance', label: 'メンテナンス' },
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

export function updateRoleProfile(roleId, profile) {
  roleProfiles[roleId] = {
    ...(roleProfiles[roleId] ?? {}),
    ...profile,
  }
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
  offline: '停止',
  unknown: '不明',
}

export const graphPoints = [38, 45, 42, 58, 61, 54, 68, 64, 71, 76, 73, 82]
