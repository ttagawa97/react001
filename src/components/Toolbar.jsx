export function Toolbar({ title, action, detail = 'モックデータで画面構成を確認できます。', onAction, actionDisabled = false }) {
  return (
    <div className="toolbar">
      <div>
        <h2>{title}</h2>
        <p>{detail}</p>
      </div>
      <button type="button" disabled={actionDisabled} onClick={onAction}>{action}</button>
    </div>
  )
}

export function PanelHeader({ title, detail }) {
  return (
    <div className="panel-header">
      <div>
        <h2>{title}</h2>
        <p>{detail}</p>
      </div>
    </div>
  )
}
