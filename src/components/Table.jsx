import { useMemo, useState } from 'react'

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

export function Table({ headers, rows, compact = false, className = '', columnWidths = [] }) {
  const [sortConfig, setSortConfig] = useState(null)
  const panelClassName = [
    'table-panel',
    compact ? 'compact-table' : '',
    className,
  ].filter(Boolean).join(' ')
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
    <section className={panelClassName}>
      <table>
        {columnWidths.length > 0 && (
          <colgroup>
            {headers.map((header, index) => (
              <col key={header} style={{ width: columnWidths[index] }} />
            ))}
          </colgroup>
        )}
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th
                key={header}
                aria-sort={
                  sortConfig?.columnIndex === index
                    ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending')
                    : 'none'
                }
              >
                <button className="sort-header-button" type="button" onClick={() => toggleSort(index)}>
                  <span>{header}</span>
                  <span aria-hidden="true" className="sort-indicator">
                    {sortConfig?.columnIndex === index ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '↕'}
                  </span>
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row, index) => (
            <tr
              className={[
                row.selected ? 'selected-row' : '',
                row.onDoubleClick ? 'interactive-row' : '',
              ].filter(Boolean).join(' ')}
              key={row.id ?? index}
              onClick={row.onClick}
              onDoubleClick={row.onDoubleClick}
              tabIndex={row.onDoubleClick ? 0 : undefined}
            >
              {getRowCells(row).map((cell, cellIndex) => (
                <td key={`${index}-${cellIndex}`}>{cell}</td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={headers.length}>該当するデータがありません</td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  )
}
