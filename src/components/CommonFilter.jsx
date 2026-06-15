import { Box, Text } from '@chakra-ui/react'

import { roleLabels, roleProfiles } from '../data/constants'
import { companies, sites } from '../data/store'
import { FilterPanel, SelectField } from './FormFields'

export function CommonFilter({ role, filter, onChange }) {
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

  function changeCompany(companyId) {
    onChange({ companyId, siteId: 'all' })
  }

  function changeSite(siteId) {
    const selectedSite = sites.find((site) => site.id === siteId)
    onChange({
      ...filter,
      companyId: filter.companyId === 'all' && selectedSite ? selectedSite.companyId : filter.companyId,
      siteId,
    })
  }

  return (
    <FilterPanel>
      <SelectField
        label="企業"
        value={filter.companyId}
        onChange={changeCompany}
        disabled={companyDisabled}
        formControlProps={{ flex: '0 0 220px', minW: '220px', maxW: '220px' }}
      >
        {role === 'system_admin' && <option value="all">全企業</option>}
        {companyOptions.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
      </SelectField>
      <SelectField
        label="現場"
        value={filter.siteId}
        onChange={changeSite}
        disabled={siteDisabled}
        formControlProps={{ flex: '0 0 220px', minW: '220px', maxW: '220px' }}
      >
        {!profile.siteId && <option value="all">全現場</option>}
        {siteOptions.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}
      </SelectField>
      <Box
        className="filter-note"
        flex="0 0 180px"
        minW="180px"
        maxW="180px"
        bg="rgba(8, 13, 23, 0.74)"
        borderColor="whiteAlpha.200"
        borderRadius="18px"
        px="4"
        py="3"
      >
        <Text color="gray.500" fontSize="11px" fontWeight="700">適用権限</Text>
        <Text color="cyan.300" fontSize="sm" fontWeight="700">{roleLabels[role]}</Text>
      </Box>
    </FilterPanel>
  )
}
