import '@/styles/tag.scss'

// variant: 'freeform' (cyan) | 'skill' (purple)
export default function Tag({ label, variant = 'freeform' }) {
  return (
    <span className={`tag tag--${variant}`}>{label}</span>
  )
}