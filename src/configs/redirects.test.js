import fs from 'fs'
import path from 'path'
import { describe, expect, it } from 'vitest'

const root = path.resolve(__dirname, '../..')
const config = fs.readFileSync(path.join(root, 'next.config.js'), 'utf8')

/** Does a Pages Router route like /apps/banners exist as a page file? */
const pageExists = route => {
  const base = path.join(root, 'src/pages', route)
  return ['.js', '.jsx', '/index.js', '/index.jsx'].some(ext => fs.existsSync(base + ext))
}

describe('next.config redirects', () => {
  const pairs = [...config.matchAll(/source: '([^']+)', destination: '([^']+)'/g)].map(m => ({ source: m[1], destination: m[2] }))

  it('declares the redirects for the retired duplicate CMS pages', () => {
    expect(pairs).toEqual(
      expect.arrayContaining([
        { source: '/apps/cms/banners', destination: '/apps/banners' },
        { source: '/apps/cms/tips', destination: '/apps/tips' }
      ])
    )
  })

  it('only ever redirects to a page that exists, and never from a page that still exists', () => {
    expect(pairs.length).toBeGreaterThan(0)
    for (const { source, destination } of pairs) {
      expect(pageExists(destination), `${destination} must exist`).toBe(true)
      expect(pageExists(source), `${source} should be gone`).toBe(false)
    }
  })
})
