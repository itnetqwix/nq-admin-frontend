/** Leaf-path diffs between two pricing config objects. */
export function pricingConfigDiff(saved, draft, max = 40) {
  const out = []
  const walk = (a, b, prefix) => {
    if (out.length >= max) return
    const aObj = a && typeof a === 'object' && !Array.isArray(a)
    const bObj = b && typeof b === 'object' && !Array.isArray(b)
    if (aObj || bObj) {
      const keys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})])
      for (const k of keys) {
        if (out.length >= max) return
        walk(a?.[k], b?.[k], prefix ? `${prefix}.${k}` : k)
      }
      return
    }
    if (JSON.stringify(a) === JSON.stringify(b)) return
    out.push({ path: prefix || '(root)', from: a, to: b })
  }
  walk(saved, draft, '')
  return out
}

export function formatDiffValue(v) {
  if (v === undefined) return '∅'
  if (v === null) return 'null'
  if (typeof v === 'string') return v.length > 48 ? `${v.slice(0, 45)}…` : v
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  try {
    const s = JSON.stringify(v)
    return s.length > 48 ? `${s.slice(0, 45)}…` : s
  } catch {
    return String(v)
  }
}
