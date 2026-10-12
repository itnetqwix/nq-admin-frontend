import fs from 'fs'
import path from 'path'
import { describe, expect, it } from 'vitest'
import { ALL_PERMISSION_KEYS, ROLE_MATRIX } from './adminRoleMatrix'

// The frontend hand-mirrors the backend's permission matrix. This test compares them directly so
// a key added on one side cannot be silently missing on the other. It is skipped when the backend
// repo is not checked out next to this one (for example in an isolated CI job).
const BACKEND = path.resolve(__dirname, '../../../nq-backend-main/src/modules/admin/adminPermission.ts')
const hasBackend = fs.existsSync(BACKEND)

function backendKeys() {
  const source = fs.readFileSync(BACKEND, 'utf8')
  const block = source.slice(source.indexOf('export const ALL_PERMISSION_KEYS = ['), source.indexOf('] as const;', source.indexOf('export const ALL_PERMISSION_KEYS')))
  return [...block.matchAll(/^\s+"([a-z_]+)",$/gm)].map(m => m[1])
}

describe.skipIf(!hasBackend)('admin role matrix: frontend mirrors backend', () => {
  it('lists exactly the same permission keys', () => {
    const be = backendKeys()
    expect(be.length).toBeGreaterThan(60)
    expect([...ALL_PERMISSION_KEYS].sort()).toEqual([...be].sort())
  })

  it('gives each built-in role the same growth access', () => {
    expect(ROLE_MATRIX.Admin.growth_read).toBe(true)
    expect(ROLE_MATRIX.Operator.growth_read).toBe(true)
    expect(ROLE_MATRIX.Auditor.growth_read).toBe(true)
    expect(ROLE_MATRIX.Support.growth_read).toBe(false)
  })
})

describe.skipIf(!hasBackend)('support permissions', () => {
  it('lets Support change tickets but not Auditor', () => {
    expect(ROLE_MATRIX.Support.support_write).toBe(true)
    expect(ROLE_MATRIX.Operator.support_write).toBe(true)
    expect(ROLE_MATRIX.Auditor.support_write).toBe(false)
  })
})
