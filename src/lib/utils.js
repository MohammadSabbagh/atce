// currency: 'USD' | 'SYP'  (defaults to 'USD' for backward compat)
export function formatCurrency(amount, currency = 'USD') {
  if (amount == null) return '—'
  const n = Number(amount).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
  if (currency === 'SYP') return `LS ${n}`
  return `$${n}`
}

export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// Calculate age from date_of_birth string
export function calcAge(dob) {
  const today = new Date()
  const birth = new Date(dob)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

export function calcYearsToRetirement(dob, retirementAge = 65) {
  return Math.max(0, retirementAge - calcAge(dob))
}