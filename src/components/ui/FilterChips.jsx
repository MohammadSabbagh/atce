import '@/styles/filter-chips.scss'

export default function FilterChips({ options, value, onChange, variant = 'status' }) {
  return (
    <div className={`filter-chips filter-chips--${variant}`}>
      {options.map((opt) => (
        <button
          key={opt.value}
          className={`filter-chips__chip ${value === opt.value ? 'filter-chips__chip--active' : ''}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}