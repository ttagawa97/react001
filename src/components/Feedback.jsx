export function ApiErrorBanner({ message, onClose }) {
  return (
    <div className="api-error-banner" role="alert">
      <span>{message}</span>
      <button className="ghost-button" type="button" onClick={onClose}>閉じる</button>
    </div>
  )
}

export function LoadingStrip({ children = 'APIからデータを取得しています...' }) {
  return <div className="loading-strip">{children}</div>
}
