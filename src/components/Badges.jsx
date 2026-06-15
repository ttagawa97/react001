import { Badge } from '@chakra-ui/react'

import { statusLabels } from '../data/constants'

export function StatusBadge({ status }) {
  const statusMap = {
    online: { bg: 'rgba(5, 150, 105, 0.24)', color: '#6ee7b7' },
    warning: { bg: 'rgba(217, 119, 6, 0.24)', color: '#fcd34d' },
    offline: { bg: 'rgba(225, 29, 72, 0.24)', color: '#fda4af' },
    unknown: { bg: 'rgba(71, 85, 105, 0.42)', color: '#cbd5e1' },
  }
  const normalizedStatus = statusMap[status] ? status : 'unknown'
  const style = statusMap[normalizedStatus]

  return (
    <Badge px="3" py="1.5" borderRadius="full" fontSize="xs" fontWeight="700" bg={style.bg} color={style.color}>
      {statusLabels[normalizedStatus]}
    </Badge>
  )
}

export function StatusPill({ tone, children }) {
  const toneMap = {
    active: { bg: 'mint.100', color: 'mint.700' },
    inactive: { bg: 'gray.100', color: 'gray.700' },
  }
  const style = toneMap[tone] ?? { bg: 'brand.50', color: 'brand.700' }

  return (
    <Badge px="3" py="1.5" borderRadius="full" fontSize="xs" fontWeight="700" bg={style.bg} color={style.color}>
      {children}
    </Badge>
  )
}
