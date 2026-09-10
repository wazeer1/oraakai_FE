/**
 * AI-generated JSON doesn't reliably match the schema we ask for — a field
 * we expect as a plain string can come back as a nested object (observed:
 * `platform_recommendation` returned as
 * `{mobile_app, web_application, admin_panel, backend_api}` instead of a
 * sentence), and a field we expect as `string[]` can come back as a single
 * string or a list of objects. Rendering any of that directly crashes React
 * ("Objects are not valid as a React child"). These coerce whatever
 * actually arrives into something always safe to render.
 */

function humanizeKey(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

export function toDisplayText(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) {
    return value.map(toDisplayText).filter(Boolean).join(', ')
  }
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, val]) => {
        const text = toDisplayText(val)
        return text ? `${humanizeKey(key)}: ${text}` : ''
      })
      .filter(Boolean)
      .join(' • ')
  }
  return String(value)
}

/** Coerces a value that's supposed to be a list into a safe array of display strings. */
export function toDisplayList(value: unknown): string[] {
  if (value === null || value === undefined) return []
  if (Array.isArray(value)) return value.map(toDisplayText).filter(Boolean)
  const text = toDisplayText(value)
  return text ? [text] : []
}
