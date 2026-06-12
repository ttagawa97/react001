import { Badge } from '@chakra-ui/react'

import { statusLabels } from '../data/constants'

export function StatusBadge({ status }) {
  const statusMap = {
    online: { bg: 'mint.100', color: 'mint.700' },
    warning: { bg: 'orange.100', color: 'orange.700' },
    offline: { bg: 'red.100', color: 'red.700' },
  }
  const style = statusMap[status] ?? { bg: 'gray.100', color: 'gray.700' }

  return (
    <Badge px="3" py="1.5" borderRadius="full" fontSize="xs" fontWeight="700" bg={style.bg} color={style.color}>
      {statusLabels[status]}
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
