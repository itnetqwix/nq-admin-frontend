/** URL-safe slug from title (blog/CMS pages). */
export function slugify(text) {
  return String(text || '')
    .trim()
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}
