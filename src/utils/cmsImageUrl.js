import { resolvePublicMediaCdnBase } from 'src/utils/vercelEnv'

/** Resolve CMS image key or absolute URL for previews and thumbnails. */
export function resolveCmsImageUrl(url) {
  if (!url || typeof url !== 'string') return ''
  const normalized = url.trim()
  if (!normalized) return ''
  if (/^https?:\/\//i.test(normalized)) return normalized
  if (normalized.startsWith('//')) return `https:${normalized}`
  return `${resolvePublicMediaCdnBase()}/${normalized.replace(/^\/+/, '')}`
}
