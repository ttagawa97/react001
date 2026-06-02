export function Toolbar({ title, action, detail = 'モックデータで画面構成を確認できます。', onAction }) {
  return (
    <div className="toolbar">
      <div>
        <h2>{title}</h2>
        <p>{detail}</p>
      </div>
      <button type="button" onClick={onAction}>{action}</button>
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
