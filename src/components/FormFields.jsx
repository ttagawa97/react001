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

export function InputField({ label, type, defaultValue, value, onChange, disabled = false, name }) {
  const controlledProps = value === undefined
    ? { defaultValue }
    : { value, onChange: (event) => onChange?.(event.target.value) }

  return (
    <label>
      <span>{label}</span>
      <input disabled={disabled} name={name} type={type} {...controlledProps} />
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
