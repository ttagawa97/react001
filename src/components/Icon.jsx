export function Icon({ type }) {
  const icons = {
    grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
    device: 'M6 4h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm3 16h6',
    company: 'M4 20V5a1 1 0 0 1 1-1h9v16M14 8h5a1 1 0 0 1 1 1v11M8 8h2M8 12h2M8 16h2M17 12h1M17 16h1M3 20h18',
    site: 'M4 20V9l8-5 8 5v11M9 20v-6h6v6M4 20h16',
    user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 8a7 7 0 0 1 14 0',
    tune: 'M4 7h10M18 7h2M4 17h2M10 17h10M14 5v4M8 15v4',
    alert: 'M12 4 3 20h18L12 4zm0 5v5m0 3h.01',
    log: 'M5 4h14v16H5zM8 8h8M8 12h8M8 16h5',
  }

  return (
    <svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d={icons[type]} />
    </svg>
  )
}
