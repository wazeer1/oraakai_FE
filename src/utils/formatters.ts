/** Formats an ISO date string / Date as e.g. "8 Sep 2026". */
export function formatDate(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

/** Formats a number as USD currency, e.g. 1200.5 -> "$1,200.50". */
export function formatCurrency(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value)
}

/** Truncates text to `maxLength` characters, appending an ellipsis if cut. */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength).trimEnd()}…`
}
