import { assignableRoles } from '../data/constants'

export function getUserAddRoleOptions(operatorRole, companyId, siteId) {
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
