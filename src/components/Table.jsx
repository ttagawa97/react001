import { useMemo, useState } from 'react'
import {
  Box,
  Button,
  Table as ChakraTable,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react'

function getRowCells(row) {
  return row.cells ?? row
}

function getCellSortValue(cell) {
  if (cell == null) return ''
  if (typeof cell === 'number') return cell
  if (typeof cell === 'string') return cell
  if (typeof cell === 'boolean') return cell ? 1 : 0
  if (Array.isArray(cell)) return cell.map(getCellSortValue).join(' ')
  if (typeof cell === 'object' && 'props' in cell) return getCellSortValue(cell.props.children)
  return String(cell)
}

function compareCells(a, b) {
  const left = getCellSortValue(a)
  const right = getCellSortValue(b)

  if (typeof left === 'number' && typeof right === 'number') return left - right

  return String(left).localeCompare(String(right), 'ja', {
    numeric: true,
    sensitivity: 'base',
  })
}

export function Table({ headers, rows, compact = false, className = '', columnWidths = [], containerProps = {} }) {
  const [sortConfig, setSortConfig] = useState(null)
  const sortedRows = useMemo(() => {
    if (!sortConfig) return rows

    return rows
      .map((row, index) => ({ row, index }))
      .sort((left, right) => {
        const leftCell = getRowCells(left.row)[sortConfig.columnIndex]
        const rightCell = getRowCells(right.row)[sortConfig.columnIndex]
        const result = compareCells(leftCell, rightCell)
        const stableResult = result === 0 ? left.index - right.index : result
        return sortConfig.direction === 'asc' ? stableResult : -stableResult
      })
      .map(({ row }) => row)
  }, [rows, sortConfig])

  function toggleSort(columnIndex) {
    setSortConfig((current) => {
      if (!current || current.columnIndex !== columnIndex) return { columnIndex, direction: 'asc' }
      return { columnIndex, direction: current.direction === 'asc' ? 'desc' : 'asc' }
    })
  }

  return (
    <TableContainer
      className={['table-panel', compact ? 'compact-table' : '', className].filter(Boolean).join(' ')}
      bg="rgba(18, 27, 43, 0.92)"
      border="1px solid"
      borderColor="whiteAlpha.200"
      borderRadius="28px"
      boxShadow="0 18px 55px rgba(0, 0, 0, 0.22)"
      backdropFilter="blur(18px)"
      overflowX="auto"
      {...containerProps}
    >
      <ChakraTable variant="simple">
        {columnWidths.length > 0 && (
          <colgroup>
            {headers.map((header, index) => (
              <col key={header} style={{ width: columnWidths[index] }} />
            ))}
          </colgroup>
        )}
        <Thead>
          <Tr>
            {headers.map((header, index) => (
              <Th
                key={header}
                bg="rgba(8, 13, 23, 0.96)"
                color="gray.400"
                fontSize="11px"
                fontWeight="800"
                letterSpacing="0.04em"
                aria-sort={
                  sortConfig?.columnIndex === index
                    ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending')
                    : 'none'
                }
              >
                <Button
                  className="sort-header-button"
                  type="button"
                  variant="ghost"
                  justifyContent="space-between"
                  width="100%"
                  px="0"
                  py="0"
                  minH="auto"
                  h="auto"
                  onClick={() => toggleSort(index)}
                >
                  <Box as="span" overflow="hidden" textOverflow="ellipsis">{header}</Box>
                  <Box as="span" aria-hidden="true" className="sort-indicator">
                    {sortConfig?.columnIndex === index ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '↕'}
                  </Box>
                </Button>
              </Th>
            ))}
          </Tr>
        </Thead>
        <Tbody>
          {sortedRows.map((row, index) => (
            <Tr
              className={[
                row.selected ? 'selected-row' : '',
                row.onDoubleClick ? 'interactive-row' : '',
              ].filter(Boolean).join(' ')}
              key={row.id ?? index}
              onClick={row.onClick}
              onDoubleClick={row.onDoubleClick}
              tabIndex={row.onDoubleClick ? 0 : undefined}
              _hover={row.onDoubleClick ? { bg: 'whiteAlpha.100' } : undefined}
            >
              {getRowCells(row).map((cell, cellIndex) => (
                <Td key={`${index}-${cellIndex}`} color="gray.200" py={compact ? '3' : '4'}>{cell}</Td>
              ))}
            </Tr>
          ))}
          {rows.length === 0 && (
            <Tr>
              <Td colSpan={headers.length}>該当するデータがありません</Td>
            </Tr>
          )}
        </Tbody>
      </ChakraTable>
    </TableContainer>
  )
}
