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

// src/lib/numerals.js
const ARABIC_INDIC = '٠١٢٣٤٥٦٧٨٩';

export const toWesternDigits = (str) => {
  if (str == null) return '';
  return String(str)
    .replace(/[٠-٩]/g, (d) => ARABIC_INDIC.indexOf(d))
    .replace(/٫/g, '.')   // Arabic decimal separator
    .replace(/،/g, '');   // Arabic thousands separator (strip)
};

// For amounts: keep digits + one decimal point only
export const sanitizeDecimalInput = (str) => {
  const western = toWesternDigits(str);
  // strip everything except digits and dots
  const cleaned = western.replace(/[^\d.]/g, '');
  // collapse multiple dots — keep first
  const parts = cleaned.split('.');
  if (parts.length <= 1) return cleaned;
  return parts[0] + '.' + parts.slice(1).join('');
};