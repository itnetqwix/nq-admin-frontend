const S3_BASE = (
  process.env.NEXT_PUBLIC_S3_BASE_URL ||
  'https://netqwix-prod.s3.us-east-2.amazonaws.com'
).replace(/\/$/, '')

/** Resolve CMS image key or absolute URL for previews and thumbnails. */
export function resolveCmsImageUrl(url) {
  if (!url || typeof url !== 'string') return ''
  const normalized = url.trim()
  if (!normalized) return ''
  if (/^https?:\/\//i.test(normalized)) return normalized
  if (normalized.startsWith('//')) return `https:${normalized}`
  return `${S3_BASE}/${normalized.replace(/^\/+/, '')}`
}
