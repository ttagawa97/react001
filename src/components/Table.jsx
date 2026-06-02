export function Table({ headers, rows, compact = false }) {
  return (
    <section className={compact ? 'table-panel compact-table' : 'table-panel'}>
      <table>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
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
              {(row.cells ?? row).map((cell, cellIndex) => (
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
