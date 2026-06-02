export function FilterPanel({ children }) {
  return <section className="filter-panel">{children}</section>
}

export function SelectField({ label, value, onChange, children, disabled = false }) {
  return (
    <label>
      <span>{label}</span>
      <select disabled={disabled} value={value} onChange={(event) => onChange(event.target.value)}>
        {children}
      </select>
    </label>
  )
}

export function InputField({ label, type, defaultValue, disabled = false, name }) {
  return (
    <label>
      <span>{label}</span>
      <input disabled={disabled} name={name} type={type} defaultValue={defaultValue} />
    </label>
  )
}

export function TextareaField({ label, defaultValue, name }) {
  return (
    <label>
      <span>{label}</span>
      <textarea defaultValue={defaultValue} name={name} />
    </label>
  )
}
